import "server-only";

import { EVENT_TYPE_LABELS, type EventType } from "@/core/domain/event";
import { sendResendEmail } from "@/infrastructure/email/send-resend-email";
import { EMAIL_LOGO_URL } from "@/shared/constants/email-brand";
import { SITE_URL } from "@/shared/constants/site";
import { formatEventDateTimeRange } from "@/shared/utils/event-format";

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

export interface EventInstructorAssignedEmailInput {
  recipientName: string;
  eventTitle: string;
  eventType: EventType;
  categoryName: string | null;
  startAt: Date;
  endAt: Date;
  locationName: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  eventId: string;
}

function resolveLocationLabel(input: EventInstructorAssignedEmailInput): string {
  if (input.isOnline) {
    return input.meetingUrl?.trim() ? `Çevrimiçi · ${input.meetingUrl.trim()}` : "Çevrimiçi";
  }
  return input.locationName?.trim() || "D2P Academy";
}

export function buildEventInstructorAssignedEmail(
  input: EventInstructorAssignedEmailInput,
): { subject: string; html: string } {
  const instructorPanelUrl = `${SITE_URL}/instructor`;
  const attendanceUrl = `${SITE_URL}/instructor/events/${input.eventId}/attendance`;
  const name = escapeHtml(input.recipientName);
  const title = escapeHtml(input.eventTitle);
  const dateRange = escapeHtml(formatEventDateTimeRange(input.startAt, input.endAt));
  const location = escapeHtml(resolveLocationLabel(input));
  const typeLabel = escapeHtml(EVENT_TYPE_LABELS[input.eventType]);
  const category = input.categoryName ? escapeHtml(input.categoryName) : null;

  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Size Yeni Etkinlik Atandı</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Merhaba <strong>${name}</strong>, D2P Academy'de aşağıdaki etkinliğe <strong>eğitmen</strong> olarak atandınız.
    </p>
    <div style="margin:0 0 20px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#0f172a;">${title}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#475569;"><strong>Tarih:</strong> ${dateRange}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#475569;"><strong>Konum:</strong> ${location}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#475569;"><strong>Tür:</strong> ${typeLabel}</p>
      ${category ? `<p style="margin:0;font-size:14px;color:#475569;"><strong>Kategori:</strong> ${category}</p>` : ""}
    </div>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Eğitmen panelinden etkinliği görüntüleyebilir ve günlük yoklama alabilirsiniz.
    </p>
    <a href="${attendanceUrl}" style="display:inline-block;margin-right:8px;padding:12px 20px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Yoklama Al</a>
    <a href="${instructorPanelUrl}" style="display:inline-block;margin-top:12px;padding:12px 20px;border:1px solid #cbd5e1;color:#0f172a;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">Eğitmen Paneli</a>
  `;

  return {
    subject: `D2P Academy | Size etkinlik atandı: ${input.eventTitle}`,
    html: emailLayout(content),
  };
}

export async function sendEventInstructorAssignedEmail(input: {
  recipientName: string;
  email: string;
  event: EventInstructorAssignedEmailInput;
}): Promise<{ id: string }> {
  const email = buildEventInstructorAssignedEmail({
    ...input.event,
    recipientName: input.recipientName,
  });

  return sendResendEmail({
    to: input.email,
    subject: email.subject,
    html: email.html,
  });
}
