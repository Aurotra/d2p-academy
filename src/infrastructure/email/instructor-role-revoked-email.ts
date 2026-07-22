import "server-only";

import { isResendConfigured, sendResendEmail } from "@/infrastructure/email/send-resend-email";
import { SITE_URL } from "@/shared/constants/site";

const BRAND_PRIMARY = "#2563eb";
const LOGO_URL = "https://d2pacademy.com/logo.png";
const FOOTER_TEXT = "© 2025 D2P Academy | ATH Mühendislik";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>D2P Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:28px 24px 12px;text-align:center;background:linear-gradient(180deg,#eff6ff 0%,#ffffff 100%);">
              <img src="${LOGO_URL}" alt="D2P Academy" width="160" style="display:block;margin:0 auto 12px;max-width:160px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background-color:#f1f5f9;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">${FOOTER_TEXT}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildInstructorRoleRevokedEmail(input: {
  recipientName: string;
  memberRole: "parent" | "student" | "admin" | "instructor";
}): { subject: string; html: string } {
  const loginUrl = `${SITE_URL}/login`;
  const name = escapeHtml(input.recipientName);
  const panelLabel =
    input.memberRole === "parent"
      ? "veli paneline"
      : input.memberRole === "admin"
        ? "admin ve veli paneline"
        : "üye paneline";

  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Eğitmen Yetkiniz Kaldırıldı</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Merhaba <strong>${name}</strong>, D2P Academy hesabınızdaki <strong>eğitmen yetkisi</strong> yönetici tarafından kaldırıldı.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Artık Eğitmen Paneli'ne erişemezsiniz. ${panelLabel.charAt(0).toUpperCase() + panelLabel.slice(1)} giriş yapmaya devam edebilirsiniz.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
      Giriş adresi: <a href="${loginUrl}" style="color:${BRAND_PRIMARY};font-weight:bold;">${loginUrl}</a>
    </p>
    <a href="${loginUrl}" style="display:inline-block;margin-top:20px;padding:12px 20px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Giriş Yap</a>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      Bu değişiklikle ilgili sorularınız için D2P Academy ile iletişime geçebilirsiniz.
    </p>
  `;

  return {
    subject: "D2P Academy | Eğitmen yetkiniz kaldırıldı",
    html: emailLayout(content),
  };
}

export async function sendInstructorRoleRevokedEmail(input: {
  recipientName: string;
  email: string;
  memberRole: "parent" | "student" | "admin" | "instructor";
}): Promise<boolean> {
  if (!isResendConfigured()) {
    return false;
  }

  const email = buildInstructorRoleRevokedEmail({
    recipientName: input.recipientName,
    memberRole: input.memberRole,
  });
  await sendResendEmail({
    to: input.email,
    subject: email.subject,
    html: email.html,
  });

  return true;
}
