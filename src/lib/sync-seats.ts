/**
 * Fires a seat sync request to update Stripe subscription quantity.
 * Safe to call from server-side routes — uses internal fetch.
 */
export async function syncSeatsForWorkspace(workspaceId: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://workchores.com";
  try {
    await fetch(`${siteUrl}/api/stripe/sync-seats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
  } catch {
    // Non-blocking — don't fail the parent operation if seat sync fails
    console.error(`Failed to sync seats for workspace ${workspaceId}`);
  }
}
