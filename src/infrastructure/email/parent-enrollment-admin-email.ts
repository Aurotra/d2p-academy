import "server-only";

import { sendResendEmail } from "@/infrastructure/email/send-resend-email";
import { EMAIL_LOGO_URL } from "@/shared/constants/email-brand";
import { SITE_URL } from "@/shared/constants/site";

const BRAND_PRIMARY = "#2563eb";
const LOGO_URL = EMAIL_LOGO_URL;
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

function row(label: string, value: string): string {
  return `<tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:bold;color:${BRAND_PRIMARY};">${escapeHtml(label)}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${escapeHtml(value)}</td>
      </tr>`;
}

export function buildParentEnrollmentAdminEmail(input: {
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  eventTitle: string;
  paymentLabel: string;
  eventId: string;
}): { subject: string; html: string } {
  const adminUrl = `${SITE_URL}/admin/enrollments?event_id=${encodeURIComponent(input.eventId)}`;
  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Yeni kurs kaydı</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Veli panelinden bir öğrenci kursa kaydoldu.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      ${row("Öğrenci", input.studentName)}
      ${row("Veli", input.parentName)}
      ${row("Veli e-posta", input.parentEmail)}
      ${row("Telefon", input.parentPhone)}
      ${row("Kurs", input.eventTitle)}
      ${row("Ödeme", input.paymentLabel)}
    </table>
    <a href="${adminUrl}" style="display:inline-block;margin-top:8px;padding:12px 20px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Kayıtları görüntüle</a>
  `;

  return {
    subject: `Yeni kurs kaydı: ${input.studentName} — ${input.eventTitle}`,
    html: emailLayout(content),
  };
}

export async function sendParentEnrollmentAdminEmail(
  to: string,
  input: Parameters<typeof buildParentEnrollmentAdminEmail>[0],
): Promise<{ id: string }> {
  const email = buildParentEnrollmentAdminEmail(input);
  return sendResendEmail({
    to,
    subject: email.subject,
    html: email.html,
  });
}
