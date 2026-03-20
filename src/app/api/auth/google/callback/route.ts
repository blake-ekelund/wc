import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

const STATE_MAX_AGE = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://workchores.com";

  if (error || !code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/app?email_error=cancelled`);
  }

  // Verify the signed state parameter
  let userId: string;
  try {
    const { uid, ts, sig } = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
    const expected = crypto.createHmac("sha256", secret).update(`${uid}:${ts}`).digest("hex").slice(0, 16);

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return NextResponse.redirect(`${appUrl}/app?email_error=invalid_state`);
    }

    // Check state hasn't expired
    if (Date.now() - parseInt(ts, 10) > STATE_MAX_AGE) {
      return NextResponse.redirect(`${appUrl}/app?email_error=state_expired`);
    }

    userId = uid;
  } catch {
    return NextResponse.redirect(`${appUrl}/app?email_error=invalid_state`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${appUrl}/app?email_error=token_failed`);
  }

  const tokens = await tokenRes.json();

  // Get user's Gmail address
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userInfoRes.json();
  const gmailAddress = userInfo.email;

  // Store tokens in Supabase using service role (bypasses RLS)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  // Get user's workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.redirect(`${appUrl}/app?email_error=no_workspace`);
  }

  // Upsert the connection
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: upsertError } = await supabase
    .from("email_connections")
    .upsert(
      {
        user_id: userId,
        workspace_id: membership.workspace_id,
        provider: "google",
        email: gmailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
      },
      { onConflict: "user_id,provider" }
    );

  if (upsertError) {
    console.error("Upsert email connection error:", upsertError);
    return NextResponse.redirect(`${appUrl}/app?email_error=save_failed`);
  }

  return NextResponse.redirect(`${appUrl}/app?email_connected=true`);
}
