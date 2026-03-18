import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Check if user has a workspace
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name, industry)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding");
  }

  const workspace = (memberships[0] as Record<string, unknown>).workspaces as { id: string; name: string; industry: string | null } | null;
  const role = memberships[0].role;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          Welcome to {workspace?.name || "your workspace"}!
        </h1>
        <p className="text-muted mb-2">
          Your workspace is set up and ready to go.
        </p>
        <p className="text-sm text-muted mb-8">
          Industry: <strong className="text-foreground">{workspace?.industry || "General"}</strong> · Role: <strong className="text-foreground capitalize">{role}</strong>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
          >
            Go to CRM →
          </a>
        </div>
        <p className="mt-6 text-xs text-muted">
          Full CRM experience coming soon. For now, explore the demo.
        </p>
      </div>
    </div>
  );
}
