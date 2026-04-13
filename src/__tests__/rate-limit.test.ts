import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextRequest and NextResponse before importing the module
vi.mock("next/server", () => {
  return {
    NextRequest: class {
      headers: Map<string, string>;
      constructor(url: string, init?: { headers?: Record<string, string> }) {
        this.headers = new Map(Object.entries(init?.headers || {}));
      }
    },
    NextResponse: {
      json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
        return { body, status: init?.status || 200, headers: init?.headers || {} };
      },
    },
  };
});

import { createRateLimiter, getClientIp } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

function mockRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/test", { headers }) as unknown as NextRequest;
}

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = mockRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip", () => {
    const req = mockRequest({ "x-real-ip": "10.0.0.1" });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("prefers x-forwarded-for over x-real-ip", () => {
    const req = mockRequest({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "10.0.0.1" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = mockRequest({});
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("createRateLimiter", () => {
  beforeEach(() => {
    // Reset the rate limiter store between tests by creating unique IDs
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ max: 3, id: "test-allow" });
    const req = mockRequest({ "x-forwarded-for": "1.1.1.1" });

    expect(limiter(req)).toBeNull();
    expect(limiter(req)).toBeNull();
    expect(limiter(req)).toBeNull();
  });

  it("blocks requests at the limit with 429", () => {
    const limiter = createRateLimiter({ max: 2, id: "test-block" });
    const req = mockRequest({ "x-forwarded-for": "2.2.2.2" });

    expect(limiter(req)).toBeNull(); // 1st - allowed
    expect(limiter(req)).toBeNull(); // 2nd - allowed

    const blocked = limiter(req); // 3rd - blocked
    expect(blocked).not.toBeNull();
    expect((blocked as { status: number }).status).toBe(429);
  });

  it("tracks different IPs independently", () => {
    const limiter = createRateLimiter({ max: 1, id: "test-ip-isolation" });

    const req1 = mockRequest({ "x-forwarded-for": "3.3.3.3" });
    const req2 = mockRequest({ "x-forwarded-for": "4.4.4.4" });

    expect(limiter(req1)).toBeNull(); // IP 1 - allowed
    expect(limiter(req2)).toBeNull(); // IP 2 - allowed

    const blocked1 = limiter(req1); // IP 1 again - blocked
    expect(blocked1).not.toBeNull();

    // IP 2 should still be independent — it only had 1 request
    const blocked2 = limiter(req2);
    expect(blocked2).not.toBeNull();
  });

  it("resets after the time window expires", () => {
    const originalNow = Date.now;
    let fakeTime = 1000000;
    vi.spyOn(Date, "now").mockImplementation(() => fakeTime);

    const limiter = createRateLimiter({ max: 1, windowMs: 1000, id: "test-window" });
    const req = mockRequest({ "x-forwarded-for": "5.5.5.5" });

    expect(limiter(req)).toBeNull(); // allowed

    const blocked = limiter(req); // blocked
    expect(blocked).not.toBeNull();

    // Advance time past the window
    fakeTime += 1100;

    expect(limiter(req)).toBeNull(); // allowed again

    Date.now = originalNow;
    vi.restoreAllMocks();
  });

  it("includes Retry-After header in 429 response", () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 30000, id: "test-retry-header" });
    const req = mockRequest({ "x-forwarded-for": "6.6.6.6" });

    limiter(req); // use up the limit
    const blocked = limiter(req) as unknown as { headers: Record<string, string> };

    expect(blocked).not.toBeNull();
    expect(blocked.headers["Retry-After"]).toBe("30");
  });
});
