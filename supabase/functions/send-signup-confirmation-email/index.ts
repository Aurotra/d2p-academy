import { sendResendEmail } from "../notify-user/email-templates.ts";

const BRAND_PRIMARY = "#2563eb";

interface SignupConfirmationRequest {
  recipientName: string;
  email: string;
  actionLink: string;
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

function buildSignupConfirmationEmail(input: SignupConfirmationRequest): { subject: string; html: string } {
  const name = escapeHtml(input.recipientName);
  const actionLink = escapeHtml(input.actionLink);

  return {
    subject: "D2P Academy | E-posta adresinizi onaylayın",
    html: emailLayout(`
      <h1 style="margin:0 0 12px;font-size:22px;">Hesabınızı Onaylayın</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Merhaba <strong>${name}</strong>, D2P Academy veli hesabınızı oluşturmak için son bir adım kaldı.
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Aşağıdaki butona tıklayarak e-posta adresinizi onaylayın.
      </p>
      <a href="${actionLink}" style="display:inline-block;margin-top:8px;padding:12px 20px;background-color:${BRAND_PRIMARY};color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:bold;">E-postamı Onayla</a>
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
    const body = (await request.json()) as SignupConfirmationRequest;
    const recipientName = body.recipientName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const actionLink = body.actionLink?.trim() ?? "";

    if (!recipientName || !email || !email.includes("@") || !actionLink.startsWith("http")) {
      return jsonResponse({ error: "Geçerli alıcı adı, e-posta ve onay bağlantısı zorunludur." }, 400);
    }

    const message = buildSignupConfirmationEmail({ recipientName, email, actionLink });

    await sendResendEmail({
      to: email,
      subject: message.subject,
      html: message.html,
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    console.error("[send-signup-confirmation-email]", message);
    return jsonResponse({ error: message }, 500);
  }
});
