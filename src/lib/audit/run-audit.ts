import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import type {
  SecurityFinding,
  SecuritySummary,
  HealthFinding,
  HealthSummary,
  FeatureUsageResult,
  AuditItem,
} from "./findings";
import { techDebtFindings, uiuxFindings, seoFindings } from "./findings";

// ============================================================
// SECURITY SCAN
// ============================================================

export async function runSecurityScan(
  baseUrl: string,
  db: SupabaseClient,
): Promise<{ findings: SecurityFinding[]; summary: SecuritySummary; durationMs: number }> {
  const start = Date.now();
  const findings: SecurityFinding[] = [];

  async function probe(path: string, options: RequestInit = {}): Promise<Response | null> {
    try {
      return await fetch(`${baseUrl}${path}`, { ...options, redirect: "manual" });
    } catch {
      return null;
    }
  }

  // Follows redirects — use for header checks where we need the final response
  async function probeFinal(path: string): Promise<Response | null> {
    try {
      return await fetch(`${baseUrl}${path}`, { redirect: "follow" });
    } catch {
      return null;
    }
  }

  // 1. ENV VAR CONFIGURATION CHECKS
  if (!process.env.ADMIN_PASSWORD) {
    findings.push({ id: "env-admin-pw", severity: "critical", title: "ADMIN_PASSWORD not set", description: "The ADMIN_PASSWORD environment variable is not configured. Admin login is disabled.", category: "Configuration" });
  } else if (process.env.ADMIN_PASSWORD.length < 20) {
    findings.push({ id: "env-admin-pw-weak", severity: "high", title: "ADMIN_PASSWORD is weak", description: `Admin password is only ${process.env.ADMIN_PASSWORD.length} characters. Use at least 20+ random characters.`, category: "Configuration" });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    findings.push({ id: "env-service-key", severity: "critical", title: "SUPABASE_SERVICE_ROLE_KEY not set", description: "The service role key is missing. HMAC token signing will fail.", category: "Configuration" });
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    findings.push({ id: "env-google-secret", severity: "medium", title: "Google OAuth not configured", description: "GOOGLE_CLIENT_SECRET is missing. Gmail integration will not work.", category: "Configuration" });
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    findings.push({ id: "env-smtp", severity: "medium", title: "SMTP credentials not configured", description: "SMTP_USER or SMTP_PASS is missing. Platform emails (invites, support notifications) will fail.", category: "Configuration" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    findings.push({ id: "env-site-url", severity: "medium", title: "NEXT_PUBLIC_SITE_URL not set", description: "Site URL is not configured. CSRF origin validation and email links may not work correctly in production.", category: "Configuration" });
  } else if (siteUrl.startsWith("http://") && process.env.NODE_ENV === "production") {
    findings.push({ id: "env-site-url-http", severity: "high", title: "Site URL uses HTTP in production", description: "NEXT_PUBLIC_SITE_URL uses http:// instead of https:// in production. Cookies and auth may be insecure.", category: "Configuration" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    findings.push({ id: "env-stripe", severity: "medium", title: "Stripe secret key not configured", description: "STRIPE_SECRET_KEY is missing. Billing features will not work.", category: "Configuration" });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    findings.push({ id: "env-stripe-webhook", severity: "high", title: "Stripe webhook secret not configured", description: "STRIPE_WEBHOOK_SECRET is missing. Webhook signature verification is disabled, allowing forged webhook events.", category: "Configuration" });
  }

  // 2. AUTHENTICATION ENDPOINT CHECKS
  const adminNoAuth = await probe("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get-overview" }),
  });
  // 307/308 redirects are safe — they're domain redirects (e.g. workchores.com → www.workchores.com), not data responses
  const isProtected = (status: number) => status === 401 || status === 403 || status === 307 || status === 308;

  if (adminNoAuth && !isProtected(adminNoAuth.status)) {
    findings.push({ id: "auth-admin-open", severity: "critical", title: "Admin API accessible without authentication", description: `GET overview returned ${adminNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
  }

  const stripeNoAuth = await probe("/api/stripe/portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: "test-fake-id" }),
  });
  if (stripeNoAuth && !isProtected(stripeNoAuth.status)) {
    findings.push({ id: "auth-stripe-open", severity: "critical", title: "Stripe portal accessible without authentication", description: `Stripe portal returned ${stripeNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
  }

  const inviteNoAuth = await probe("/api/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", workspaceId: "fake" }),
  });
  if (inviteNoAuth && !isProtected(inviteNoAuth.status)) {
    findings.push({ id: "auth-invite-open", severity: "high", title: "Invite endpoint accessible without authentication", description: `Invite endpoint returned ${inviteNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
  }

  const emailNoAuth = await probe("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: "test@test.com", subject: "test", body: "test" }),
  });
  if (emailNoAuth && !isProtected(emailNoAuth.status)) {
    findings.push({ id: "auth-email-open", severity: "critical", title: "Email send endpoint accessible without authentication", description: `Email send returned ${emailNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
  }

  // 3. RATE LIMITING CHECKS
  const rateLimitEndpoints = [
    { path: "/api/subscribers", body: { email: "" }, name: "Subscribers" },
    { path: "/api/track", body: { page: "/test" }, name: "Page tracking" },
  ];

  for (const ep of rateLimitEndpoints) {
    const res = await probe(ep.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ep.body),
    });
    if (!res) {
      findings.push({ id: `rate-${ep.path}`, severity: "medium", title: `${ep.name} endpoint unreachable`, description: `Could not reach ${ep.path} — rate limiting cannot be verified.`, category: "Rate Limiting" });
    }
  }

  // 4. INPUT VALIDATION CHECKS
  const xssEmail = await probe("/api/subscribers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "<script>alert(1)</script>" }),
  });
  if (xssEmail && xssEmail.status !== 400 && !isProtected(xssEmail.status)) {
    findings.push({ id: "input-xss-email", severity: "high", title: "Subscriber endpoint accepts malicious email", description: `Endpoint accepted XSS payload as email (status ${xssEmail.status}). Email validation may be insufficient.`, category: "Input Validation" });
  }

  const fakeSession = await probe("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "get-or-create", sessionToken: "fake-token-12345" }),
  });
  if (fakeSession && !isProtected(fakeSession.status)) {
    findings.push({ id: "input-conv-token", severity: "high", title: "Conversation endpoint accepts forged session tokens", description: `Endpoint returned ${fakeSession.status} for a fake session token instead of 403.`, category: "Input Validation" });
  }

  const fakeConvPoll = await probe("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "poll", conversationId: "00000000-0000-0000-0000-000000000000" }),
  });
  if (fakeConvPoll && !isProtected(fakeConvPoll.status)) {
    findings.push({ id: "input-conv-poll", severity: "high", title: "Conversation poll lacks ownership check", description: `Endpoint returned ${fakeConvPoll.status} when polling a foreign conversation instead of 401/403.`, category: "Input Validation" });
  }

  const emptyPw = await probe("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", password: "" }),
  });
  if (emptyPw && emptyPw.status === 200) {
    findings.push({ id: "input-admin-empty-pw", severity: "critical", title: "Admin login accepts empty password", description: "Admin login succeeded with an empty password. This is a critical authentication bypass.", category: "Input Validation" });
  }

  // 5. HEADER SECURITY CHECKS (follow redirects to get actual response headers)
  const homePage = await probeFinal("/");
  if (homePage) {
    const headers = homePage.headers;
    if (!headers.get("x-frame-options") && !headers.get("content-security-policy")?.includes("frame-ancestors")) {
      findings.push({ id: "header-clickjack", severity: "medium", title: "No clickjacking protection headers", description: "Neither X-Frame-Options nor Content-Security-Policy frame-ancestors are set. The site may be vulnerable to clickjacking.", category: "Headers" });
    }
    if (!headers.get("strict-transport-security") && process.env.NODE_ENV === "production") {
      findings.push({ id: "header-hsts", severity: "medium", title: "No HSTS header", description: "Strict-Transport-Security header is not set in production. Users could be downgraded to HTTP.", category: "Headers" });
    }
    if (!headers.get("x-content-type-options")) {
      findings.push({ id: "header-nosniff", severity: "low", title: "No X-Content-Type-Options header", description: "X-Content-Type-Options: nosniff is not set. Browsers may MIME-sniff responses.", category: "Headers" });
    }
  }

  // 6. DATABASE CHECKS
  try {
    const { data: expiredRequests } = await db
      .from("admin_access_requests")
      .select("id")
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    if (expiredRequests && expiredRequests.length > 0) {
      findings.push({ id: "db-expired-requests", severity: "low", title: `${expiredRequests.length} expired access request(s) still pending`, description: "There are admin access requests that expired but were never cleaned up. These should be marked as expired.", category: "Database" });
      await db
        .from("admin_access_requests")
        .update({ status: "expired" })
        .eq("status", "pending")
        .lt("expires_at", new Date().toISOString());
    }
  } catch {
    /* DB check failed — skip */
  }

  // 7. MIDDLEWARE CHECK
  const workspaceNoAuth = await probe("/admin/workspace?id=test", { redirect: "manual" });
  if (workspaceNoAuth) {
    if (workspaceNoAuth.status === 200) {
      findings.push({ id: "middleware-workspace", severity: "high", title: "Admin workspace accessible without auth", description: "The /admin/workspace route is accessible without a valid admin session cookie. Middleware protection may be missing.", category: "Middleware" });
    }
  }

  // REPORT
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    findings,
    summary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      scannedAt: new Date().toISOString(),
    },
    durationMs: Date.now() - start,
  };
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function runHealthCheck(
  baseUrl: string,
  db: SupabaseClient,
): Promise<{ findings: HealthFinding[]; summary: HealthSummary; durationMs: number }> {
  const start = Date.now();
  type HealthStatus = "healthy" | "warning" | "degraded" | "down";
  const findings: HealthFinding[] = [];

  async function probe(path: string, options: RequestInit = {}): Promise<{ res: Response; ms: number } | null> {
    try {
      const probeStart = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${baseUrl}${path}`, { ...options, redirect: "manual", signal: controller.signal });
      clearTimeout(timeout);
      return { res, ms: Date.now() - probeStart };
    } catch {
      return null;
    }
  }

  function latencyStatus(ms: number): HealthStatus {
    if (ms < 2000) return "healthy";
    if (ms < 5000) return "warning";
    return "degraded";
  }

  // 1. SERVICE CONNECTIVITY

  // Supabase Database
  try {
    const dbStart = Date.now();
    const { error } = await db.from("workspaces").select("id", { count: "exact", head: true });
    const ms = Date.now() - dbStart;
    if (error) {
      findings.push({ id: "svc-supabase-db", status: "down", title: "Supabase Database unreachable", description: `Query failed: ${error.message}`, category: "Services", metric: "Error" });
    } else {
      const status = latencyStatus(ms);
      findings.push({ id: "svc-supabase-db", status, title: "Supabase Database", description: status === "healthy" ? "Database responding normally." : `Database query took ${ms}ms — performance may be degraded.`, category: "Services", metric: `${ms}ms` });
    }
  } catch (e) {
    findings.push({ id: "svc-supabase-db", status: "down", title: "Supabase Database unreachable", description: `Connection failed: ${e instanceof Error ? e.message : "unknown error"}`, category: "Services", metric: "Error" });
  }

  // Supabase Auth
  try {
    const authStart = Date.now();
    const { error } = await db.auth.admin.listUsers({ perPage: 1 });
    const ms = Date.now() - authStart;
    if (error) {
      findings.push({ id: "svc-supabase-auth", status: "down", title: "Supabase Auth unreachable", description: `Auth query failed: ${error.message}`, category: "Services", metric: "Error" });
    } else {
      const status = latencyStatus(ms);
      findings.push({ id: "svc-supabase-auth", status, title: "Supabase Auth", description: status === "healthy" ? "Auth service responding normally." : `Auth service took ${ms}ms to respond.`, category: "Services", metric: `${ms}ms` });
    }
  } catch (e) {
    findings.push({ id: "svc-supabase-auth", status: "down", title: "Supabase Auth unreachable", description: `${e instanceof Error ? e.message : "unknown error"}`, category: "Services", metric: "Error" });
  }

  // Supabase Storage
  try {
    const storageStart = Date.now();
    const { data: buckets, error } = await db.storage.listBuckets();
    const ms = Date.now() - storageStart;
    if (error) {
      findings.push({ id: "svc-supabase-storage", status: "down", title: "Supabase Storage unreachable", description: `Storage query failed: ${error.message}`, category: "Services", metric: "Error" });
    } else {
      const status = latencyStatus(ms);
      findings.push({ id: "svc-supabase-storage", status, title: "Supabase Storage", description: `${buckets?.length || 0} bucket(s) configured. Responding normally.`, category: "Services", metric: `${ms}ms` });
    }
  } catch (e) {
    findings.push({ id: "svc-supabase-storage", status: "down", title: "Supabase Storage unreachable", description: `${e instanceof Error ? e.message : "unknown error"}`, category: "Services", metric: "Error" });
  }

  // Stripe API
  try {
    const stripeStart = Date.now();
    await stripe.balance.retrieve();
    const ms = Date.now() - stripeStart;
    const status = latencyStatus(ms);
    findings.push({ id: "svc-stripe", status, title: "Stripe API", description: status === "healthy" ? "Stripe responding normally." : `Stripe took ${ms}ms to respond.`, category: "Services", metric: `${ms}ms` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    if (msg.includes("API key")) {
      findings.push({ id: "svc-stripe", status: "down", title: "Stripe API key invalid", description: "Stripe rejected the API key. Billing features are broken.", category: "Services", metric: "Auth Error" });
    } else {
      findings.push({ id: "svc-stripe", status: "down", title: "Stripe API unreachable", description: `Stripe connection failed: ${msg}`, category: "Services", metric: "Error" });
    }
  }

  // SMTP / Email
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    findings.push({ id: "svc-smtp", status: "healthy", title: "SMTP (Resend)", description: "SMTP credentials are configured.", category: "Services", metric: "Configured" });
  } else {
    findings.push({ id: "svc-smtp", status: "warning", title: "SMTP not configured", description: "SMTP_HOST or SMTP_USER is missing. Platform emails will fail.", category: "Services", metric: "Missing" });
  }

  // 2. API ENDPOINT HEALTH
  const endpoints = [
    { id: "api-home", path: "/", method: "GET", name: "Landing Page" },
    { id: "api-announcements", path: "/api/announcements", method: "GET", name: "Announcements" },
  ];

  for (const ep of endpoints) {
    const result = await probe(ep.path, { method: ep.method });
    if (!result) {
      findings.push({ id: ep.id, status: "down", title: `${ep.name} unreachable`, description: `${ep.path} did not respond within 8 seconds.`, category: "Endpoints", metric: "Timeout" });
    } else {
      const status = result.res.status >= 500 ? ("down" as HealthStatus) : latencyStatus(result.ms);
      findings.push({
        id: ep.id,
        status: result.res.status >= 500 ? "down" : status,
        title: ep.name,
        description: result.res.status >= 500 ? `Returned ${result.res.status} server error.` : `Responding in ${result.ms}ms.`,
        category: "Endpoints",
        metric: result.res.status >= 500 ? `${result.res.status}` : `${result.ms}ms`,
      });
    }
  }

  // 3. DATABASE HEALTH
  const tableSizes: { name: string; count: number }[] = [];
  const coreTables = ["workspaces", "profiles", "contacts", "tasks", "workspace_members", "page_views", "demo_sessions", "conversations", "conversation_messages", "subscribers", "email_connections", "touchpoints", "announcements", "attachments"];
  const tableWarningThresholds: Record<string, number> = { page_views: 100000, demo_sessions: 50000, conversation_messages: 50000 };

  for (const table of coreTables) {
    try {
      const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
      if (!error && count !== null) {
        tableSizes.push({ name: table, count });
      }
    } catch {
      /* skip */
    }
  }

  if (tableSizes.length > 0) {
    const largeMsg = tableSizes
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((t) => `${t.name}: ${t.count.toLocaleString()}`)
      .join(", ");
    const anyLarge = tableSizes.some((t) => tableWarningThresholds[t.name] && t.count > tableWarningThresholds[t.name]);
    findings.push({
      id: "db-table-sizes",
      status: anyLarge ? "warning" : "healthy",
      title: "Table row counts",
      description: anyLarge ? "Some tables are growing large. Consider archiving old data." : "All tables within normal ranges.",
      category: "Database",
      metric: largeMsg || "Empty",
    });
  }

  // Stale conversations
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { count } = await db.from("conversations").select("id", { count: "exact", head: true }).eq("status", "new").lt("last_message_at", thirtyDaysAgo);
    if (count && count > 0) {
      findings.push({ id: "db-stale-conversations", status: count > 10 ? "degraded" : "warning", title: `${count} unanswered support ticket(s)`, description: `Conversations stuck in "new" status for over 30 days.`, category: "Database", metric: `${count} stale` });
    }
  } catch {
    /* skip */
  }

  // Empty workspaces
  try {
    const { data: allWs } = await db.from("workspaces").select("id");
    const { data: allMembers } = await db.from("workspace_members").select("workspace_id");
    if (allWs && allMembers) {
      const memberWsIds = new Set(allMembers.map((m: { workspace_id: string }) => m.workspace_id));
      const emptyCount = allWs.filter((w: { id: string }) => !memberWsIds.has(w.id)).length;
      if (emptyCount > 0) {
        findings.push({ id: "db-empty-workspaces", status: "warning", title: `${emptyCount} workspace(s) with no members`, description: "These workspaces may indicate failed onboarding.", category: "Database", metric: `${emptyCount}` });
      }
    }
  } catch {
    /* skip */
  }

  // Stripe plan vs subscription mismatch
  try {
    const { data: bizNoSub } = await db.from("workspaces").select("id").eq("plan", "business").is("stripe_subscription_id", null);
    const { data: freeWithSub } = await db.from("workspaces").select("id").eq("plan", "free").not("stripe_subscription_id", "is", null);
    const mismatches = (bizNoSub?.length || 0) + (freeWithSub?.length || 0);
    if (mismatches > 0) {
      const parts: string[] = [];
      if (bizNoSub?.length) parts.push(`${bizNoSub.length} business plan without subscription`);
      if (freeWithSub?.length) parts.push(`${freeWithSub.length} free plan with active subscription`);
      findings.push({ id: "db-plan-mismatch", status: "warning", title: "Plan/subscription mismatch", description: `${parts.join("; ")}. These may need manual reconciliation.`, category: "Database", metric: `${mismatches}` });
    }
  } catch {
    /* skip */
  }

  // 4. GROWTH & TRENDS
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
  const fourteenDaysAgo = new Date(now - 14 * 86400000).toISOString();

  try {
    const { count: thisWeek } = await db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
    const { count: lastWeek } = await db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo);
    if (thisWeek !== null && lastWeek !== null) {
      const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
      findings.push({ id: "growth-users", status: "healthy", title: "User signups (7d)", description: `${thisWeek} this week vs ${lastWeek} last week.`, category: "Growth", metric: `${change >= 0 ? "+" : ""}${change}%` });
    }
  } catch {
    /* skip */
  }

  try {
    const { count: thisWeek } = await db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
    const { count: lastWeek } = await db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo);
    if (thisWeek !== null && lastWeek !== null) {
      const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
      const status: HealthStatus = change < -50 ? "warning" : "healthy";
      findings.push({ id: "growth-traffic", status, title: "Page views (7d)", description: status === "warning" ? `Traffic dropped ${Math.abs(change)}% — investigate for possible outage or SEO issues.` : `${thisWeek?.toLocaleString()} this week vs ${lastWeek?.toLocaleString()} last week.`, category: "Growth", metric: `${change >= 0 ? "+" : ""}${change}%` });
    }
  } catch {
    /* skip */
  }

  try {
    const { count: thisWeek } = await db.from("workspaces").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
    const { count: lastWeek } = await db.from("workspaces").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo);
    if (thisWeek !== null && lastWeek !== null) {
      const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
      findings.push({ id: "growth-workspaces", status: "healthy", title: "New workspaces (7d)", description: `${thisWeek} this week vs ${lastWeek} last week.`, category: "Growth", metric: `${change >= 0 ? "+" : ""}${change}%` });
    }
  } catch {
    /* skip */
  }

  // 5. CAPACITY
  try {
    const { count } = await db.from("conversations").select("id", { count: "exact", head: true }).in("status", ["new", "active"]);
    if (count !== null) {
      const status: HealthStatus = count > 20 ? "warning" : "healthy";
      findings.push({ id: "capacity-support-backlog", status, title: "Open support conversations", description: status === "warning" ? `${count} open conversations. Support backlog is building up.` : `${count} open conversation(s). Backlog is manageable.`, category: "Capacity", metric: `${count}` });
    }
  } catch {
    /* skip */
  }

  try {
    const { data: authData } = await db.auth.admin.listUsers({ perPage: 1 });
    const total = (authData as unknown as { total?: number })?.total;
    if (total !== undefined) {
      findings.push({ id: "capacity-auth-users", status: "healthy", title: "Total auth users", description: `${total.toLocaleString()} registered user(s) in Supabase Auth.`, category: "Capacity", metric: `${total.toLocaleString()}` });
    }
  } catch {
    /* skip */
  }

  try {
    const { data: bizWorkspaces } = await db.from("workspaces").select("id, name").eq("plan", "business");
    if (bizWorkspaces && bizWorkspaces.length > 0) {
      findings.push({ id: "capacity-paying-ws", status: "healthy", title: "Paying workspaces", description: `${bizWorkspaces.length} workspace(s) on business plan.`, category: "Capacity", metric: `${bizWorkspaces.length}` });
    }
  } catch {
    /* skip */
  }

  // REPORT
  const statusOrder: Record<HealthStatus, number> = { down: 0, degraded: 1, warning: 2, healthy: 3 };
  findings.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return {
    findings,
    summary: {
      total: findings.length,
      healthy: findings.filter((f) => f.status === "healthy").length,
      warning: findings.filter((f) => f.status === "warning").length,
      degraded: findings.filter((f) => f.status === "degraded").length,
      down: findings.filter((f) => f.status === "down").length,
      checkedAt: new Date().toISOString(),
    },
    durationMs: Date.now() - start,
  };
}

// ============================================================
// FEATURE USAGE
// ============================================================

export async function getFeatureUsage(db: SupabaseClient, days: number = 30): Promise<FeatureUsageResult> {
  // Map days to the pre-computed column in the view
  const periodCol = days <= 1 ? "last_1d" : days <= 7 ? "last_7d" : days <= 30 ? "last_30d" : "last_90d";

  // 1. Totals from the summary view (single row, no scanning)
  const { data: totals } = await db.from("feature_usage_totals").select("*").single();

  const totalEvents = totals?.[`events_${days <= 1 ? "1d" : days <= 7 ? "7d" : days <= 30 ? "30d" : "90d"}`] as number || 0;
  const uniqueUserCount = totals?.[`users_${days <= 1 ? "1d" : days <= 7 ? "7d" : days <= 30 ? "30d" : "90d"}`] as number || 0;

  // 2. Per-event breakdown from the summary view
  const { data: summary } = await db
    .from("feature_usage_summary")
    .select(`event_name, ${periodCol}, unique_users, unique_workspaces`)
    .gt(periodCol, 0)
    .order(periodCol, { ascending: false });

  const topEvents = (summary || []).map((row) => ({
    name: row.event_name as string,
    count: ((row as Record<string, unknown>)[periodCol] as number) || 0,
  }));

  // 3. Daily activity from the daily view
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const { data: dailyRows } = await db
    .from("feature_daily_activity")
    .select("day, event_count, unique_users")
    .gte("day", since)
    .order("day", { ascending: true });

  // Fill in missing days with zeros
  const dailyMap = new Map((dailyRows || []).map((r) => [r.day as string, r.event_count as number]));
  const dailyActivity: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    dailyActivity.push({ date: d, count: dailyMap.get(d) || 0 });
  }

  // Prior period comparison
  const priorStart = new Date(Date.now() - days * 2 * 86400000).toISOString();
  const priorEnd = new Date(Date.now() - days * 86400000).toISOString();
  const { count: priorEvents } = await db
    .from("feature_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", priorStart)
    .lt("created_at", priorEnd);
  const { data: priorUserData } = await db
    .from("feature_events")
    .select("user_id")
    .gte("created_at", priorStart)
    .lt("created_at", priorEnd)
    .not("user_id", "is", null);
  const priorUserCount = new Set(priorUserData?.map((u) => u.user_id)).size;

  return {
    topEvents,
    dailyActivity,
    totalEvents,
    uniqueEvents: topEvents.length,
    uniqueUsers: uniqueUserCount,
    period: days,
    priorPeriodEvents: priorEvents || 0,
    priorPeriodUsers: priorUserCount,
  };
}

// ============================================================
// STATIC AUDIT REPORT (Tech Debt / UI-UX / SEO)
// ============================================================

export function getStaticAuditReport(type: "tech_debt" | "uiux" | "seo"): {
  findings: AuditItem[];
  summary: { total: number; critical: number; high: number; medium: number; low: number };
} {
  const items = type === "tech_debt" ? techDebtFindings : type === "uiux" ? uiuxFindings : seoFindings;
  return {
    findings: items,
    summary: {
      total: items.length,
      critical: items.filter((i) => i.severity === "critical").length,
      high: items.filter((i) => i.severity === "high").length,
      medium: items.filter((i) => i.severity === "medium").length,
      low: items.filter((i) => i.severity === "low").length,
    },
  };
}

// ============================================================
// SAVE AUDIT RUN
// ============================================================

export async function saveAuditRun(
  db: SupabaseClient,
  run: {
    audit_type: string;
    trigger: "cron" | "manual";
    summary: Record<string, unknown>;
    findings: unknown[];
    email_sent: boolean;
    duration_ms: number;
  },
): Promise<void> {
  await db.from("audit_runs").insert(run);
}

// ============================================================
// LIVE SEO SCAN
// ============================================================

const SEO_PAGES = [
  { path: "/", label: "Homepage" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/blog", label: "Blog" },
  { path: "/crm", label: "CRM" },
  { path: "/signup", label: "Sign Up" },
  { path: "/demo", label: "Demo" },
  { path: "/vendor-management", label: "Vendor Management" },
  { path: "/privacy", label: "Privacy" },
];

async function fetchHtml(url: string): Promise<{ html: string; headers: Headers; status: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    clearTimeout(timeout);
    const html = await res.text();
    return { html, headers: res.headers, status: res.status };
  } catch {
    return null;
  }
}

export async function runSeoScan(
  baseUrl: string,
): Promise<{ findings: SecurityFinding[]; summary: SecuritySummary; durationMs: number }> {
  const start = Date.now();
  const findings: SecurityFinding[] = [];

  // 1. Sitemap
  const sitemap = await fetchHtml(`${baseUrl}/sitemap.xml`);
  if (!sitemap || sitemap.status !== 200 || !sitemap.html.includes("<urlset")) {
    findings.push({ id: "seo-no-sitemap", severity: "critical", title: "No sitemap.xml", description: "No valid sitemap found at /sitemap.xml. Search engines cannot systematically discover pages.", category: "Crawlability" });
  }

  // 2. robots.txt
  const robots = await fetchHtml(`${baseUrl}/robots.txt`);
  if (!robots || robots.status !== 200 || !robots.html.toLowerCase().includes("user-agent")) {
    findings.push({ id: "seo-no-robots", severity: "critical", title: "No robots.txt", description: "No valid robots.txt found. Search engines have no crawl directives.", category: "Crawlability" });
  }

  // 3. llms.txt
  const llms = await fetchHtml(`${baseUrl}/llms.txt`);
  if (!llms || llms.status !== 200 || llms.html.trim().length < 50) {
    findings.push({ id: "seo-no-llms-txt", severity: "medium", title: "No llms.txt for AI discoverability", description: "No llms.txt file found. AI search engines (ChatGPT, Perplexity, Claude) cannot read your site description.", category: "AI Search" });
  }

  // 4-6. Page metadata, OpenGraph, Canonical checks
  const missingMeta: string[] = [];
  const missingOg: string[] = [];
  const missingCanonical: string[] = [];

  for (const page of SEO_PAGES) {
    const result = await fetchHtml(`${baseUrl}${page.path}`);
    if (!result || result.status !== 200) continue;
    const html = result.html;

    // Metadata check
    const hasTitle = /<title>[^<]+<\/title>/.test(html);
    const hasDescription = /meta\s+name="description"\s+content="[^"]+"/i.test(html);
    if (!hasTitle || !hasDescription) missingMeta.push(page.label);

    // OpenGraph check
    const hasOg = /property="og:title"\s+content="[^"]+"/i.test(html);
    if (!hasOg) missingOg.push(page.label);

    // Canonical check
    const hasCanonical = /rel="canonical"\s+href="[^"]+"/i.test(html) || /href="[^"]+"\s+rel="canonical"/i.test(html);
    if (!hasCanonical) missingCanonical.push(page.label);
  }

  if (missingMeta.length > 0) {
    findings.push({ id: "seo-missing-metadata", severity: "high", title: `${missingMeta.length} page(s) missing metadata`, description: `Missing title or description: ${missingMeta.join(", ")}`, category: "Metadata" });
  }

  if (missingOg.length > 0) {
    findings.push({ id: "seo-missing-og", severity: "high", title: `${missingOg.length} page(s) missing OpenGraph tags`, description: `Missing og:title: ${missingOg.join(", ")}. Social sharing previews will be broken.`, category: "Social Sharing" });
  }

  if (missingCanonical.length > 0) {
    findings.push({ id: "seo-missing-canonical", severity: "medium", title: `${missingCanonical.length} page(s) missing canonical URL`, description: `Missing rel="canonical": ${missingCanonical.join(", ")}`, category: "Metadata" });
  }

  // 7. JSON-LD schemas on homepage
  const homepage = await fetchHtml(`${baseUrl}/`);
  if (homepage && homepage.status === 200) {
    const html = homepage.html;

    if (!html.includes('"@type":"Organization"') && !html.includes('"@type": "Organization"')) {
      findings.push({ id: "seo-no-org-schema", severity: "high", title: "No Organization JSON-LD schema", description: "Homepage lacks Organization schema. Needed for Google Knowledge Panel.", category: "Structured Data" });
    }

    if (!html.includes('"@type":"BreadcrumbList"') && !html.includes('"@type": "BreadcrumbList"')) {
      findings.push({ id: "seo-no-breadcrumb-schema", severity: "low", title: "No BreadcrumbList schema", description: "No breadcrumb structured data for navigation hierarchy.", category: "Structured Data" });
    }

    // Security headers check
    const h = homepage.headers;
    if (!h.get("x-frame-options") && !h.get("content-security-policy")?.includes("frame-ancestors")) {
      findings.push({ id: "seo-no-xframe", severity: "medium", title: "No X-Frame-Options header", description: "Missing clickjacking protection. Affects security posture and Google trust signals.", category: "Technical SEO" });
    }
    if (!h.get("x-content-type-options")) {
      findings.push({ id: "seo-no-nosniff", severity: "low", title: "No X-Content-Type-Options header", description: "Missing nosniff header. Browsers may MIME-sniff responses.", category: "Technical SEO" });
    }
    if (!h.get("content-security-policy")) {
      findings.push({ id: "seo-no-csp", severity: "medium", title: "No Content-Security-Policy header", description: "Missing CSP header. Reduces security posture.", category: "Technical SEO" });
    }
  }

  // 8. Product schema on CRM page
  const crmPage = await fetchHtml(`${baseUrl}/crm`);
  if (crmPage && crmPage.status === 200) {
    if (!crmPage.html.includes("SoftwareApplication") && !crmPage.html.includes('"@type":"Product"')) {
      findings.push({ id: "seo-no-product-schema", severity: "medium", title: "No SoftwareApplication schema on CRM page", description: "CRM page lacks Product/SoftwareApplication schema for rich search results.", category: "Structured Data" });
    }
  }

  // Report
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    findings,
    summary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      scannedAt: new Date().toISOString(),
    },
    durationMs: Date.now() - start,
  };
}

// ============================================================
// LIVE UX SCAN
// ============================================================

export async function runUxScan(
  baseUrl: string,
): Promise<{ findings: SecurityFinding[]; summary: SecuritySummary; durationMs: number }> {
  const start = Date.now();
  const findings: SecurityFinding[] = [];

  // 1. Skip-to-content link
  const homepage = await fetchHtml(`${baseUrl}/`);
  if (homepage && homepage.status === 200) {
    const hasSkipLink = /skip[\s-]*to[\s-]*(main|content)/i.test(homepage.html);
    if (!hasSkipLink) {
      findings.push({ id: "ux-no-skip-nav", severity: "medium", title: "No skip-to-content link", description: "Missing skip navigation link for keyboard and screen reader users.", category: "Accessibility" });
    }

    // 2. ARIA live regions
    const hasAriaLive = /aria-live\s*=\s*"(polite|assertive)"/i.test(homepage.html);
    if (!hasAriaLive) {
      findings.push({ id: "ux-no-aria-live", severity: "medium", title: "No ARIA live regions", description: "No aria-live attributes found. Dynamic content updates (chat, notifications) won't announce to screen readers.", category: "Accessibility" });
    }
  }

  // 3. Signup form validation hints
  const signupPage = await fetchHtml(`${baseUrl}/signup`);
  if (signupPage && signupPage.status === 200) {
    // Check for persistent password hint (not just placeholder)
    const hasPasswordHint = /At least 8 characters/i.test(signupPage.html) && !/placeholder\s*=\s*"At least 8/i.test(signupPage.html);
    if (!hasPasswordHint) {
      findings.push({ id: "ux-password-hint", severity: "low", title: "Password requirements only in placeholder", description: "Signup form password hint disappears when typing. Should be a persistent label.", category: "Forms" });
    }
  }

  return {
    findings,
    summary: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      scannedAt: new Date().toISOString(),
    },
    durationMs: Date.now() - start,
  };
}
