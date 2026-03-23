import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_COOKIE_NAME = "admin-session";

/** Convert a hex string to a Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/** Convert a Uint8Array to a hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison of two strings */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Verify admin HMAC-signed session token from cookie */
async function isValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expected = bytesToHex(new Uint8Array(signature));
    if (!timingSafeEqual(sig, expected)) return false;
    const expiry = parseInt(payload.split(":")[1], 10);
    return Date.now() <= expiry;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    },
  );

  // Refresh the session — this is critical for keeping auth alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Admin page routes: /admin/workspace requires a valid admin session cookie
  // /admin itself renders its own login form so we let it through
  if (pathname.startsWith("/admin/workspace")) {
    if (!(await isValidAdminSession(request))) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // /admin page — let it through (handles its own login UI)
  if (pathname === "/admin") {
    return supabaseResponse;
  }

  // Protected routes: /app and /onboarding require auth
  const isProtectedRoute = pathname.startsWith("/app") || pathname.startsWith("/onboarding");
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // If authenticated user hits /signin or /signup, redirect to /app
  const isAuthPage = pathname === "/signin" || pathname === "/signup";
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
