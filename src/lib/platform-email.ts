import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || "WorkChores <blake.ekelund@workchores.com>";

// =============================================
// Generic send
// =============================================
export async function sendPlatformEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return true;
  } catch (err) {
    console.error("Platform email error:", err);
    return false;
  }
}

// =============================================
// Team invite email
// =============================================
export async function sendTeamInviteEmail({
  to,
  inviterName,
  workspaceName,
  actionUrl,
  role,
}: {
  to: string;
  inviterName: string;
  workspaceName: string;
  actionUrl: string;
  role: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff;">
      <div style="padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
        <div style="display: inline-block; width: 48px; height: 48px; background: #3b82f6; border-radius: 12px; line-height: 48px; text-align: center; margin-bottom: 16px;">
          <span style="color: white; font-size: 20px; font-weight: bold;">W</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px;">You're invited!</h1>
        <p style="font-size: 15px; color: #555; margin: 0; line-height: 1.5;">
          <strong>${inviterName}</strong> invited you to join <strong>${workspaceName}</strong> as a <strong>${role}</strong> on WorkChores.
        </p>
      </div>
      <div style="padding: 32px; text-align: center;">
        <a href="${actionUrl}" style="display: inline-block; padding: 14px 40px; background: #3b82f6; color: white; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(59,130,246,0.3);">
          Join ${workspaceName}
        </a>
        <p style="font-size: 12px; color: #aaa; margin-top: 20px; line-height: 1.5;">
          Or copy and paste this link into your browser:<br>
          <a href="${actionUrl}" style="color: #3b82f6; word-break: break-all;">${actionUrl}</a>
        </p>
      </div>
      <div style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #f0f0f0; text-align: center;">
        <p style="font-size: 11px; color: #999; margin: 0;">
          WorkChores CRM · Simple sales tracking for small teams
        </p>
      </div>
    </div>
  `;

  return sendPlatformEmail({
    to,
    subject: `${inviterName} invited you to ${workspaceName} on WorkChores`,
    html,
  });
}

// =============================================
// Support notification (to admin)
// =============================================
export async function sendSupportNotification({
  userInfo,
  userEmail,
  message,
  pageUrl,
}: {
  userInfo: string;
  userEmail: string;
  message: string;
  pageUrl: string;
}): Promise<boolean> {
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
      <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h2 style="margin: 0 0 12px; font-size: 16px; color: #1a1a2e;">New Support Message</h2>
        <table style="font-size: 14px; color: #555;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">From:</td><td>${userInfo}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Email:</td><td><a href="mailto:${userEmail}">${userEmail}</a></td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Page:</td><td>${pageUrl}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Time:</td><td>${timestamp}</td></tr>
        </table>
      </div>
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
        <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
      </div>
      ${userEmail !== "unknown" ? `<p style="margin-top: 16px; font-size: 13px; color: #888;">Reply: <a href="mailto:${userEmail}">${userEmail}</a></p>` : ""}
    </div>
  `;

  return sendPlatformEmail({
    to: "blake.ekelund@workchores.com",
    subject: `[Support] ${message.slice(0, 60)}${message.length > 60 ? "..." : ""}`,
    html,
  });
}
