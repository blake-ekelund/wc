import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateTotpSecret, verifyTotp } from "@/lib/totp";

function getServiceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...body } = await request.json();
    const db = getServiceDb();

    // check-login doesn't require active session (called during signin before redirect)
    if (action === "check-login") {
      const { userId, code } = body;
      if (!userId || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

      const { data: profile } = await db
        .from("profiles")
        .select("totp_secret, totp_enabled")
        .eq("id", userId)
        .single();

      if (!profile?.totp_enabled || !profile?.totp_secret) {
        return NextResponse.json({ valid: true }); // No 2FA required
      }

      const valid = verifyTotp(profile.totp_secret, code);
      return NextResponse.json({ valid });
    }

    // All other actions require authenticated user
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    switch (action) {
      case "get-status": {
        const { data: profile } = await db
          .from("profiles")
          .select("totp_enabled")
          .eq("id", user.id)
          .single();
        return NextResponse.json({ enabled: profile?.totp_enabled || false });
      }

      case "setup": {
        const { secret, uri } = generateTotpSecret();
        const QRCode = (await import("qrcode")).default;
        const userEmail = user.email || "user";
        const qrUri = `otpauth://totp/WorkChores:${userEmail}?secret=${secret}&issuer=WorkChores&digits=6&period=30`;
        const qrDataUrl = await QRCode.toDataURL(qrUri, { width: 200, margin: 2 });

        // Store as pending (not active until verified)
        await db
          .from("profiles")
          .update({ totp_secret: secret })
          .eq("id", user.id);

        return NextResponse.json({ secret, uri: qrUri, qrDataUrl });
      }

      case "verify": {
        const { code } = body;
        if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

        const { data: profile } = await db
          .from("profiles")
          .select("totp_secret")
          .eq("id", user.id)
          .single();

        if (!profile?.totp_secret) {
          return NextResponse.json({ error: "No 2FA setup in progress. Start setup first." }, { status: 400 });
        }

        if (!verifyTotp(profile.totp_secret, code)) {
          return NextResponse.json({ error: "Invalid code. Check your authenticator app." }, { status: 400 });
        }

        // Verified — activate 2FA
        await db
          .from("profiles")
          .update({ totp_enabled: true })
          .eq("id", user.id);

        return NextResponse.json({ success: true });
      }

      case "disable": {
        await db
          .from("profiles")
          .update({ totp_secret: null, totp_enabled: false })
          .eq("id", user.id);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
