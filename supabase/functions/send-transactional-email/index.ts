import { sendResendEmail } from "../notify-user/email-templates.ts";

interface TransactionalEmailRequest {
  to?: string;
  subject?: string;
  html?: string;
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
    const body = (await request.json()) as TransactionalEmailRequest;
    const to = body.to?.trim().toLowerCase() ?? "";
    const subject = body.subject?.trim() ?? "";
    const html = body.html?.trim() ?? "";

    if (!to.includes("@") || !subject || !html) {
      return jsonResponse({ error: "to, subject ve html zorunludur." }, 400);
    }

    await sendResendEmail({ to, subject, html });
    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "E-posta gönderilemedi.";
    console.error("[send-transactional-email]", message);
    return jsonResponse({ error: message }, 500);
  }
});
