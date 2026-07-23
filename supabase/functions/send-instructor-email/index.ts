import { sendResendEmail } from "../notify-user/email-templates.ts";

const SITE_URL = "https://www.d2p.com.tr";
const BRAND_PRIMARY = "#2563eb";

interface InstructorEmailRequest {
  kind: "granted" | "revoked";
  recipientName: string;
  email: string;
  memberRole?: "parent" | "student" | "admin" | "instructor";
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

function buildGrantedEmail(name: string): { subject: string; html: string } {
  const loginUrl = `${SITE_URL}/login`;
  return {
    subject: "D2P Academy | Eğitmen paneli erişiminiz açıldı",
    html: emailLayout(`
      <h1 style="margin:0 0 12px;font-size:22px;">Eğitmen Paneli Erişiminiz Açıldı</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Merhaba <strong>${escapeHtml(name)}</strong>, D2P Academy hesabınıza <strong>eğitmen yetkisi</strong> tanımlandı.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Mevcut e-posta adresiniz ve şifrenizle veli girişi yapın; panelinizde Eğitmen Paneli bağlantısını göreceksiniz.
      </p>
      <p style="margin:0;font-size:14px;"><a href="${loginUrl}" style="color:${BRAND_PRIMARY};font-weight:bold;">${loginUrl}</a></p>
    `),
  };
}

function buildRevokedEmail(
  name: string,
  memberRole: InstructorEmailRequest["memberRole"],
): { subject: string; html: string } {
  const loginUrl = `${SITE_URL}/login`;
  const panelLabel =
    memberRole === "parent"
      ? "veli paneline"
      : memberRole === "admin"
        ? "admin ve veli paneline"
        : "üye paneline";

  return {
    subject: "D2P Academy | Eğitmen yetkiniz kaldırıldı",
    html: emailLayout(`
      <h1 style="margin:0 0 12px;font-size:22px;">Eğitmen Yetkiniz Kaldırıldı</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Merhaba <strong>${escapeHtml(name)}</strong>, hesabınızdaki <strong>eğitmen yetkisi</strong> kaldırıldı.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Artık Eğitmen Paneli'ne erişemezsiniz. ${panelLabel.charAt(0).toUpperCase() + panelLabel.slice(1)} giriş yapmaya devam edebilirsiniz.
      </p>
      <p style="margin:0;font-size:14px;"><a href="${loginUrl}" style="color:${BRAND_PRIMARY};font-weight:bold;">${loginUrl}</a></p>
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
    const body = (await request.json()) as InstructorEmailRequest;
    const recipientName = body.recipientName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!recipientName || !email || !email.includes("@")) {
      return jsonResponse({ error: "Geçerli alıcı adı ve e-posta zorunludur." }, 400);
    }

    if (body.kind !== "granted" && body.kind !== "revoked") {
      return jsonResponse({ error: "Geçersiz e-posta türü." }, 400);
    }

    const message =
      body.kind === "granted"
        ? buildGrantedEmail(recipientName)
        : buildRevokedEmail(recipientName, body.memberRole ?? "parent");

    await sendResendEmail({
      to: email,
      subject: message.subject,
      html: message.html,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    console.error("[send-instructor-email]", message);
    return jsonResponse({ error: message }, 500);
  }
});
