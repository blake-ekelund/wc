import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/signin", process.env.NEXT_PUBLIC_SITE_URL || "https://workchores.com"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || "https://workchores.com"}/api/auth/google/callback`;

  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  // Sign the state to prevent CSRF — attacker can't forge a valid state
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
  const timestamp = Date.now().toString();
  const payload = `${user.id}:${timestamp}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  const state = Buffer.from(JSON.stringify({ uid: user.id, ts: timestamp, sig })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
