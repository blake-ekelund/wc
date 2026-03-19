import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

interface EmailAttachment {
  filename: string;
  mimeType: string;
  data: string; // base64
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request — support both JSON and FormData
  let to: string, subject: string, body: string, cc: string | undefined, bcc: string | undefined;
  const attachments: EmailAttachment[] = [];

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    to = formData.get("to") as string;
    subject = formData.get("subject") as string;
    body = formData.get("body") as string;
    cc = (formData.get("cc") as string) || undefined;
    bcc = (formData.get("bcc") as string) || undefined;

    // Collect file attachments
    const files = formData.getAll("attachments");
    for (const file of files) {
      if (file instanceof Blob) {
        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length === 0) continue; // Skip empty files
        const name = (file as File).name || `attachment-${attachments.length + 1}`;
        attachments.push({
          filename: name,
          mimeType: file.type || "application/octet-stream",
          data: buffer.toString("base64"),
        });
      }
    }
  } else {
    const json = await request.json();
    to = json.to;
    subject = json.subject;
    body = json.body;
    cc = json.cc;
    bcc = json.bcc;
  }

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 });
  }

  // Get user's email connection
  const { data: connection } = await supabase
    .from("email_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  if (!connection) {
    return NextResponse.json({ error: "Gmail not connected. Connect your Gmail in Settings." }, { status: 400 });
  }

  let accessToken = connection.access_token;

  // Refresh token if needed
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(connection.refresh_token);
    if (!refreshed) {
      return NextResponse.json({ error: "Gmail token expired. Please reconnect your Gmail." }, { status: 401 });
    }
    accessToken = refreshed.access_token;

    const cookieStore = await cookies();
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    await serviceSupabase
      .from("email_connections")
      .update({
        access_token: accessToken,
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      })
      .eq("id", connection.id);
  }

  // Fetch user's email signature
  const { data: profile } = await supabase
    .from("profiles")
    .select("email_signature")
    .eq("id", user.id)
    .single();

  let fullBody = body;
  if (profile?.email_signature) {
    const sigHtml = (profile.email_signature as string)
      .replace(/\n/g, "<br>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#3b82f6">$1</a>');
    fullBody += `<br><br><div style="border-top: 1px solid #d1d5db; padding-top: 12px; margin-top: 12px; color: #6b7280; font-size: 13px;">${sigHtml}</div>`;
  }

  // Build RFC 2822 email message
  let rawMessage: string;

  if (attachments.length > 0) {
    // Multipart MIME with attachments
    const boundary = `boundary_${crypto.randomUUID().replace(/-/g, "")}`;

    const headerLines = [
      `From: ${connection.email}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      ...(bcc ? [`Bcc: ${bcc}`] : []),
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ].join("\r\n");

    // HTML body part
    let parts = `--${boundary}\r\n`;
    parts += `Content-Type: text/html; charset="UTF-8"\r\n`;
    parts += `Content-Transfer-Encoding: base64\r\n\r\n`;
    parts += Buffer.from(fullBody).toString("base64") + "\r\n";

    // Attachment parts
    for (const att of attachments) {
      parts += `--${boundary}\r\n`;
      parts += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
      parts += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
      parts += `Content-Transfer-Encoding: base64\r\n\r\n`;
      parts += att.data + "\r\n";
    }

    parts += `--${boundary}--`;
    rawMessage = `${headerLines}\r\n\r\n${parts}`;
  } else {
    // Simple HTML email (no attachments)
    const headerLines = [
      `From: ${connection.email}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      ...(bcc ? [`Bcc: ${bcc}`] : []),
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
    ].join("\r\n");

    rawMessage = `${headerLines}\r\n\r\n${fullBody}`;
  }

  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Send via Gmail API
  const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!gmailRes.ok) {
    const err = await gmailRes.text();
    console.error("Gmail send error:", err);
    return NextResponse.json({ error: "Failed to send email via Gmail" }, { status: 500 });
  }

  const result = await gmailRes.json();

  return NextResponse.json({
    success: true,
    messageId: result.id,
    threadId: result.threadId,
  });
}
