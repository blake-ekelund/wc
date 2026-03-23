import { createClient as createServiceClient } from "@supabase/supabase-js";
import VendorPortalContent from "./content";

interface PortalData {
  tokenId: string;
  vendorName: string;
  workspaceName: string;
  requestedDocs: string[];
}

async function getPortalData(token: string): Promise<PortalData | null> {
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: tokenData } = await serviceClient
    .from("vendor_portal_tokens")
    .select("id, workspace_id, vendor_id, requested_docs, expires_at")
    .eq("id", token)
    .single();

  if (!tokenData) return null;
  if (new Date(tokenData.expires_at) < new Date()) return null;

  const { data: vendor } = await serviceClient
    .from("vendors")
    .select("name")
    .eq("id", tokenData.vendor_id)
    .single();

  const { data: workspace } = await serviceClient
    .from("workspaces")
    .select("name")
    .eq("id", tokenData.workspace_id)
    .single();

  return {
    tokenId: tokenData.id,
    vendorName: vendor?.name || "Vendor",
    workspaceName: workspace?.name || "Company",
    requestedDocs: tokenData.requested_docs || [],
  };
}

export default async function VendorPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getPortalData(token);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Link Expired or Invalid</h1>
          <p className="text-muted text-sm leading-relaxed">
            This document upload link is no longer valid. It may have expired or been replaced with a new one.
            Please contact the company that sent you this link to request a new one.
          </p>
        </div>
      </div>
    );
  }

  return <VendorPortalContent {...data} />;
}
