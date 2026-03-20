import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_COOKIE_NAME = "admin-session";

/** Verify admin HMAC-signed session token from cookie */
function isValidAdminSession(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
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
    if (!isValidAdminSession(request)) {
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
