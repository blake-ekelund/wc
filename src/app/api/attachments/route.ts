import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;
    const contactId = formData.get("contactId") as string | null;
    const taskId = formData.get("taskId") as string | null;
    const touchpointId = formData.get("touchpointId") as string | null;
    const uploaderName = formData.get("uploaderName") as string || "";

    if (!file || !workspaceId) {
      return NextResponse.json({ error: "File and workspaceId required" }, { status: 400 });
    }

    if (!contactId && !taskId && !touchpointId) {
      return NextResponse.json({ error: "Must attach to a contact, task, or touchpoint" }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop() || "bin";
    const storagePath = `${workspaceId}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Save metadata
    const { data: attachment, error: dbError } = await supabase
      .from("attachments")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId || null,
        task_id: taskId || null,
        touchpoint_id: touchpointId || null,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_by: user.id,
        uploaded_by_name: uploaderName,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Attachment DB error:", dbError);
      // Clean up the uploaded file
      await supabase.storage.from("attachments").remove([storagePath]);
      return NextResponse.json({ error: "Failed to save attachment" }, { status: 500 });
    }

    return NextResponse.json({ attachment });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — list attachments for a contact/task/touchpoint
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const taskId = searchParams.get("taskId");
    const touchpointId = searchParams.get("touchpointId");

    let query = supabase.from("attachments").select("*").order("created_at", { ascending: false });

    if (contactId) query = query.eq("contact_id", contactId);
    else if (taskId) query = query.eq("task_id", taskId);
    else if (touchpointId) query = query.eq("touchpoint_id", touchpointId);
    else return NextResponse.json({ error: "Specify contactId, taskId, or touchpointId" }, { status: 400 });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate signed URLs for each attachment
    const attachmentsWithUrls = await Promise.all(
      (data || []).map(async (att) => {
        const { data: urlData } = await supabase.storage
          .from("attachments")
          .createSignedUrl(att.storage_path, 3600); // 1 hour
        return { ...att, url: urlData?.signedUrl || "" };
      })
    );

    return NextResponse.json({ attachments: attachmentsWithUrls });
  } catch (err) {
    console.error("List attachments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove an attachment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Attachment ID required" }, { status: 400 });
    }

    // Get attachment to find storage path
    const { data: att } = await supabase
      .from("attachments")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (!att) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage.from("attachments").remove([att.storage_path]);

    // Delete metadata
    await supabase.from("attachments").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete attachment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
