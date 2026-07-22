const BRAND_PRIMARY = "#2563eb";
const LOGO_URL = "https://d2pacademy.com/logo.png";
const FOOTER_TEXT = "© 2025 D2P Academy | ATH Mühendislik";
const SITE_URL = "https://www.d2p.com.tr";

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

function primaryButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 20px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">${label}</a>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function reminderIntro(reminderType: "day_after_enrollment" | "before_event"): string {
  if (reminderType === "before_event") {
    return "Etkinliğe birkaç gün kaldı. Katılımcı formlarının etkinlik başlamadan önce tamamlanması gerekiyor.";
  }
  return "Etkinliğe kayıt tamamlandı ancak katılımcı formları henüz bitirilmedi.";
}

export function buildIncompleteFormsReminderEmail(input: {
  recipientName: string;
  studentName: string;
  eventTitle: string;
  eventStartAt: string;
  missingForms: string[];
  formsUrl: string;
  reminderType: "day_after_enrollment" | "before_event";
}): { subject: string; html: string } {
  const eventDate = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(input.eventStartAt));

  const missingList = input.missingForms
    .map((item) => `<li style="margin:0 0 8px;font-size:15px;color:#334155;">${escapeHtml(item)}</li>`)
    .join("");

  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Eksik Katılımcı Formları</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Merhaba <strong>${escapeHtml(input.recipientName)}</strong>,
      <strong>${escapeHtml(input.studentName)}</strong> için
      <em>${escapeHtml(input.eventTitle)}</em> etkinliğinde tamamlanması gereken formlar var.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      ${reminderIntro(input.reminderType)}
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Etkinlik tarihi</p>
          <p style="margin:0 0 16px;font-size:15px;color:#334155;">${escapeHtml(eventDate)}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Eksik formlar</p>
          <ul style="margin:0;padding-left:20px;">${missingList}</ul>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
      Lütfen <strong>Tanışma</strong> ve <strong>Onaylar</strong> formlarını en kısa sürede tamamlayın.
    </p>
    ${primaryButton("Formları Doldur", input.formsUrl)}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748b;">
      Yol: Veli Paneli → Çocuk hesapları → Detay → Formları doldur
    </p>
  `;

  return {
    subject: `D2P Academy | ${input.studentName} için eksik formlar — ${input.eventTitle}`,
    html: emailLayout(content),
  };
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    throw new Error("RESEND_API_KEY tanımlı değil.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "D2P Academy <info@d2p.com.tr>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend hatası: ${errorBody}`);
  }
}
