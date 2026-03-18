"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { fetchWorkspaceData, createSupabaseSyncCallbacks } from "@/lib/supabase-crm";
import DemoApp from "@/components/demo/demo-app";
import { Loader2 } from "lucide-react";

export default function AppPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [crmProps, setCrmProps] = useState<Parameters<typeof DemoApp>[0] | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Get user's workspace membership
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (!memberships || memberships.length === 0) {
        router.push("/onboarding");
        return;
      }

      const workspaceId = memberships[0].workspace_id;

      try {
        const data = await fetchWorkspaceData(workspaceId, user.id);
        if (!data) {
          setError("Could not load workspace data.");
          setLoading(false);
          return;
        }

        const syncCallbacks = createSupabaseSyncCallbacks(workspaceId);

        setCrmProps({
          mode: "live",
          initialData: {
            contacts: data.contacts,
            tasks: data.tasks,
            touchpoints: data.touchpoints,
            stages: data.stages,
            teamMembers: data.teamMembers,
            customFields: data.customFields,
            customFieldValues: data.customFieldValues,
            alertSettings: data.alertSettings,
            companyName: data.workspace.name,
            industryId: data.workspace.industry || "b2b-sales",
            userName: data.userName,
            userEmail: data.userEmail,
            userRole: data.userRole === "owner" ? "admin" : data.userRole,
            workspaceId,
          },
          sync: syncCallbacks,
        });
        setLoading(false);
      } catch (err) {
        console.error("Load workspace error:", err);
        setError("Failed to load workspace. Please try again.");
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!crmProps) return null;

  return <DemoApp {...crmProps} />;
}
