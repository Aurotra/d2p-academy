import "server-only";

import { sendResendEmail } from "@/infrastructure/email/send-resend-email";
import { CONTACT } from "@/shared/constants/contact";
import { EMAIL_LOGO_URL } from "@/shared/constants/email-brand";
import { SITE_URL } from "@/shared/constants/site";
import { buildLoginForEventPath } from "@/shared/utils/event-enrollment";

const BRAND_PRIMARY = "#2563eb";
const FOOTER_TEXT = "© 2026 D2P Academy | ATH Mühendislik";

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
              <img src="${EMAIL_LOGO_URL}" alt="D2P Academy" width="160" style="display:block;margin:0 auto 12px;max-width:160px;height:auto;" />
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

export function buildStuckCardWarningEmail(input: {
  parentName: string;
  studentName: string;
  eventTitle: string;
  eventId: string;
  paymentFailed: boolean;
}): { subject: string; html: string } {
  const retryUrl = `${SITE_URL}${buildLoginForEventPath(input.eventId)}`;
  const reason = input.paymentFailed
    ? "Kart ödemesi tamamlanamadı."
    : "PayTR ekranı açıldı ama ödeme 2 saat içinde bitmedi.";

  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Kayıt yeriniz henüz duruyor</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Merhaba ${escapeHtml(input.parentName)}, ${escapeHtml(input.studentName)} için
      <strong>${escapeHtml(input.eventTitle)}</strong> kaydında kart ödemesi yarım kaldı.
      ${escapeHtml(reason)}
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Koltuk <strong>1 saat daha</strong> sizin için duruyor. Bu süre içinde ödemeyi tamamlamanız
      yeterli. Aksi halde yer başka kayıt için açılır; yeniden deneyebilirsiniz.
    </p>
    <a href="${escapeHtml(retryUrl)}" style="display:inline-block;margin-top:8px;padding:12px 20px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Ödemeyi yeniden dene</a>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      Yardım için ${escapeHtml(CONTACT.email)} veya ${escapeHtml(CONTACT.phoneDisplay)}.
    </p>
  `;

  return {
    subject: `Kart ödemesi yarım kaldı: ${input.eventTitle}`,
    html: emailLayout(content),
  };
}

export async function sendStuckCardWarningEmail(
  to: string,
  input: Parameters<typeof buildStuckCardWarningEmail>[0],
): Promise<{ id: string }> {
  const email = buildStuckCardWarningEmail(input);
  return sendResendEmail({
    to,
    subject: email.subject,
    html: email.html,
  });
}
