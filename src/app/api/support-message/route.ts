import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendSupportNotification } from "@/lib/platform-email";
import { createRateLimiter } from "@/lib/rate-limit";

// 5 support messages per minute per IP
const limiter = createRateLimiter({ max: 5, id: "support-message" });

export async function POST(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;

    const { message } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Try to get user info if authenticated
    let userInfo = "Anonymous visitor";
    let userEmail = "unknown";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || "no-email";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        userInfo = `${profile?.full_name || "User"} (${userEmail})`;
      }
    } catch {
      // Not authenticated
    }

    const referer = request.headers.get("referer") || "unknown page";

    // Save to Supabase
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await adminDb.from("support_messages").insert({
      message: message.trim(),
      user_email: userEmail,
      user_info: userInfo,
      page_url: referer,
      status: "new",
    });

    // Send notification via platform SMTP
    await sendSupportNotification({
      userInfo,
      userEmail,
      message: message.trim(),
      pageUrl: referer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Support message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
