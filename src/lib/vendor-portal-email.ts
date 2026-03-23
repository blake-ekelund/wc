import { sendPlatformEmail } from "./platform-email";

export async function sendVendorPortalEmail({
  to,
  vendorName,
  workspaceName,
  requestedDocs,
  portalUrl,
}: {
  to: string;
  vendorName: string;
  workspaceName: string;
  requestedDocs: string[];
  portalUrl: string;
}): Promise<boolean> {
  const docList = requestedDocs
    .map((d) => `<li style="padding: 4px 0; color: #334155;">${d}</li>`)
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0;">WorkChores</h1>
      </div>
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px;">
        Hi,
      </p>
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 16px;">
        <strong>${workspaceName}</strong> is requesting the following documents from <strong>${vendorName}</strong>:
      </p>
      <ul style="font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
        ${docList}
      </ul>
      <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 24px;">
        Click the button below to securely upload your documents. No account or password needed.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${portalUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">
          Upload Documents
        </a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 24px 0 0;">
        This link expires in 30 days. If you have questions, reply to this email or contact ${workspaceName} directly.
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">
        <a href="${portalUrl}" style="color: #2563eb; word-break: break-all;">${portalUrl}</a>
      </p>
    </div>
  `;

  return sendPlatformEmail({
    to,
    subject: `${workspaceName} — Document upload request`,
    html,
  });
}
