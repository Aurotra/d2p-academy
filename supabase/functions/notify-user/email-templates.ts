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

export function buildGradeEmail(input: {
  studentName: string;
  documentTitle: string;
  score: number;
  feedback: string | null;
}): { subject: string; html: string } {
  const status =
    input.score >= 85 ? "Başarılı" : input.score >= 60 ? "Geliştirilebilir" : "Yetersiz";

  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Yeni Notunuz Yayınlandı</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Merhaba <strong>${input.studentName}</strong>, <em>${input.documentTitle}</em> ödeviniz için değerlendirme tamamlandı.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Puan</p>
          <p style="margin:0;font-size:28px;font-weight:bold;color:${BRAND_PRIMARY};">${input.score}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#334155;"><strong>Durum:</strong> ${status}</p>
          ${
            input.feedback
              ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#334155;"><strong>Gelişim Yorumu:</strong><br/>${input.feedback}</p>`
              : ""
          }
        </td>
      </tr>
    </table>
    ${primaryButton("Not Raporumu Görüntüle", `${SITE_URL}/dashboard/report`)}
  `;

  return {
    subject: `D2P Academy | ${input.documentTitle} notunuz hazır`,
    html: emailLayout(content),
  };
}

export function buildDocumentEmail(input: {
  studentName: string;
  documentTitle: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Yeni Döküman Paylaşıldı</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Merhaba <strong>${input.studentName}</strong>, eğitmeniniz yeni bir materyal yükledi:
    </p>
    <p style="margin:0;padding:16px;background-color:#eff6ff;border-left:4px solid ${BRAND_PRIMARY};border-radius:8px;font-size:16px;font-weight:bold;color:#1e3a8a;">
      ${input.documentTitle}
    </p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569;">
      Dökümanı öğrenci panelinizden görüntüleyebilir ve indirebilirsiniz.
    </p>
    ${primaryButton("Dökümanları Görüntüle", `${SITE_URL}/dashboard/documents`)}
  `;

  return {
    subject: `D2P Academy | Yeni döküman: ${input.documentTitle}`,
    html: emailLayout(content),
  };
}

export function buildRegistrationAdminEmail(input: {
  fullName: string;
  phone: string;
  grade: string;
  course: string;
  createdAt: string;
}): { subject: string; html: string } {
  const formattedDate = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(input.createdAt));

  const content = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">Yeni Ön Kayıt Başvurusu</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      Web sitesinden yeni bir Eylül dönemi ön kayıt formu gönderildi.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:bold;color:${BRAND_PRIMARY};">Ad Soyad</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${input.fullName}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:bold;color:${BRAND_PRIMARY};">Telefon</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${input.phone}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:bold;color:${BRAND_PRIMARY};">Sınıf</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${input.grade}. Sınıf</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:bold;color:${BRAND_PRIMARY};">Atölye</td>
        <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#334155;">${input.course}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background-color:#eff6ff;font-size:13px;font-weight:bold;color:${BRAND_PRIMARY};">Kayıt Tarihi</td>
        <td style="padding:12px 16px;font-size:14px;color:#334155;">${formattedDate}</td>
      </tr>
    </table>
    ${primaryButton("Ön Kayıtları Görüntüle", `${SITE_URL}/admin/registrations`)}
  `;

  return {
    subject: `Yeni Ön Kayıt: ${input.fullName} - ${input.course} - ${input.phone}`,
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
