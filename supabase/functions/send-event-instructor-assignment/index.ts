import { sendResendEmail } from "../notify-user/email-templates.ts";

const SITE_URL = "https://www.d2p.com.tr";
const BRAND_PRIMARY = "#2563eb";

const EVENT_TYPE_LABELS: Record<string, string> = {
  training: "Eğitim",
  maker_workshop: "Maker Atölyesi",
  bootcamp: "Yoğun Kamp",
  seminar: "Seminer",
};

interface EventAssignmentRequest {
  recipientName: string;
  email: string;
  eventTitle: string;
  eventType: string;
  categoryName: string | null;
  startAt: string;
  endAt: string;
  locationName: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  eventId: string;
}

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
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e2e8f0;">
    <tr><td style="padding:28px;">${content}</td></tr>
  </table>
</body>
</html>`;
}

function formatDateTimeRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const formatter = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function resolveLocationLabel(input: EventAssignmentRequest): string {
  if (input.isOnline) {
    return input.meetingUrl?.trim() ? `Çevrimiçi · ${input.meetingUrl.trim()}` : "Çevrimiçi";
  }
  return input.locationName?.trim() || "D2P Academy";
}

function buildEventAssignedEmail(input: EventAssignmentRequest): { subject: string; html: string } {
  const instructorPanelUrl = `${SITE_URL}/instructor`;
  const attendanceUrl = `${SITE_URL}/instructor/events/${input.eventId}/attendance`;
  const name = escapeHtml(input.recipientName);
  const title = escapeHtml(input.eventTitle);
  const dateRange = escapeHtml(formatDateTimeRange(input.startAt, input.endAt));
  const location = escapeHtml(resolveLocationLabel(input));
  const typeLabel = escapeHtml(EVENT_TYPE_LABELS[input.eventType] ?? input.eventType);
  const category = input.categoryName ? escapeHtml(input.categoryName) : null;

  return {
    subject: `D2P Academy | Size etkinlik atandı: ${input.eventTitle}`,
    html: emailLayout(`
      <h1 style="margin:0 0 12px;font-size:22px;">Size Yeni Etkinlik Atandı</h1>
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
      <p style="margin:0;font-size:14px;"><a href="${attendanceUrl}" style="color:${BRAND_PRIMARY};font-weight:bold;">Yoklama Al</a> · <a href="${instructorPanelUrl}" style="color:${BRAND_PRIMARY};font-weight:bold;">Eğitmen Paneli</a></p>
    `),
  };
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await request.json()) as EventAssignmentRequest;
    const recipientName = body.recipientName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const eventTitle = body.eventTitle?.trim() ?? "";

    if (!recipientName || !email || !email.includes("@") || !eventTitle || !body.eventId) {
      return jsonResponse({ error: "Geçerli alıcı ve etkinlik bilgileri zorunludur." }, 400);
    }

    const message = buildEventAssignedEmail(body);

    await sendResendEmail({
      to: email,
      subject: message.subject,
      html: message.html,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    console.error("[send-event-instructor-assignment]", message);
    return jsonResponse({ error: message }, 500);
  }
});
