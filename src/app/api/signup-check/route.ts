import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

// 5 signup attempts per IP per minute
const signupLimiter = createRateLimiter({ max: 5, windowMs: 60_000, id: "signup" });

export async function POST(request: NextRequest) {
  const blocked = signupLimiter(request);
  if (blocked) return blocked;

  return NextResponse.json({ ok: true });
}
