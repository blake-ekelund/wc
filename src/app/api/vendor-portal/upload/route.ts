import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { validateUploadedFile } from "@/lib/validate-file";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ max: 10, id: "vendor-portal-upload" });

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tokenId = formData.get("token") as string | null;
    const docType = formData.get("docType") as string | null;

    if (!file || !tokenId || !docType) {
      return NextResponse.json({ error: "Missing file, token, or document type" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Validate token
    const { data: token } = await serviceClient
      .from("vendor_portal_tokens")
      .select("id, workspace_id, vendor_id, requested_docs, expires_at")
      .eq("id", tokenId)
      .single();

    if (!token) {
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });
    }

    if (new Date(token.expires_at) < new Date()) {
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    }

    // Validate file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const validation = validateUploadedFile(buffer, file.name, file.type);
    if (!validation.valid) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${token.workspace_id}/vendors/${token.vendor_id}/${docType}_${Date.now()}.${ext}`;

    const { error: uploadError } = await serviceClient.storage
      .from("attachments")
      .upload(storagePath, buffer, {
        contentType: validation.detectedMime || file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Save attachment metadata
    const { data: attachment, error: dbError } = await serviceClient
      .from("attachments")
      .insert({
        workspace_id: token.workspace_id,
        vendor_id: token.vendor_id,
        file_name: file.name,
        file_size: file.size,
        file_type: validation.detectedMime || file.type,
        storage_path: storagePath,
        uploaded_by_name: `Vendor Portal (${docType})`,
      })
      .select("id, file_name, file_size, file_type, created_at")
      .single();

    if (dbError) {
      console.error("Attachment DB error:", dbError);
      return NextResponse.json({ error: "Failed to save attachment record" }, { status: 500 });
    }

    return NextResponse.json({ success: true, attachment });
  } catch (err) {
    console.error("Vendor portal upload error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
