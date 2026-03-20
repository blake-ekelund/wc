"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DemoApp from "@/components/demo/demo-app";
import { Loader2, ArrowLeft, Shield, Eye } from "lucide-react";

export default function AdminWorkspaceViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <AdminWorkspaceView />
    </Suspense>
  );
}

function AdminWorkspaceView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workspaceId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [crmProps, setCrmProps] = useState<Parameters<typeof DemoApp>[0] | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");

  useEffect(() => {
    if (!workspaceId) {
      setError("No workspace ID provided.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setError("Not authenticated as admin.");
      setLoading(false);
      return;
    }

    async function loadWorkspaceData() {
      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-token": token! },
          body: JSON.stringify({ action: "get-workspace-view-data", workspaceId }),
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Failed to load workspace.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setWorkspaceName(data.workspace.name);

        setCrmProps({
          mode: "demo",
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
            userName: "Admin Viewer",
            userEmail: "",
            userRole: "admin",
            workspaceId: data.workspace.id,
            plan: data.workspace.plan === "business" ? "business" : "free",
            emailTemplates: data.emailTemplates,
            dashboardKpis: data.dashboardKpis,
            emailSignature: data.emailSignature,
          },
        });
        setLoading(false);
      } catch {
        setError("Failed to load workspace data.");
        setLoading(false);
      }
    }

    loadWorkspaceData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  if (!crmProps) return null;

  return (
    <div className="relative">
      {/* Admin viewer banner */}
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-amber-950 px-4 py-1.5 flex items-center justify-between text-sm font-medium shadow-md">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>Admin Read-Only View — {workspaceName}</span>
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1 px-3 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Admin
        </button>
      </div>
      <div className="pt-9">
        <DemoApp {...crmProps} />
      </div>
    </div>
  );
}
