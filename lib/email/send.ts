export type SendEmailResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "failed"; detail?: string; status?: number };

/**
 * Envio de e-mail transacional pelo Resend (API HTTP — sem dependência nova).
 *
 * O envio é **opcional por design**: sem `RESEND_API_KEY` configurada nada
 * quebra, o convite continua valendo e a interface mostra o link/código para
 * quem convidou copiar e mandar pelo canal que quiser. Assim a plataforma
 * funciona sem provedor de e-mail e melhora quando um for configurado.
 *
 * Variáveis de ambiente:
 *   RESEND_API_KEY   chave da API (https://resend.com)
 *   EMAIL_FROM       remetente verificado, ex.: "Folium <convites@seudominio.com>"
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) return { ok: false, reason: "not-configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      // O Resend responde { statusCode, message, name }. Guardamos a `message`,
      // que é o que diz o que houve ("domain is not verified", "you can only
      // send testing emails to your own email address"…) — sem ela o convite
      // falha em silêncio e não há como consertar.
      const body = await response.text().catch(() => "");
      let detail = body.slice(0, 300);
      try {
        const parsed = JSON.parse(body) as { message?: string };
        if (parsed.message) detail = parsed.message;
      } catch {
        // resposta não-JSON: fica o texto cru mesmo
      }
      return { ok: false, reason: "failed", detail, status: response.status };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "failed", detail: String(error).slice(0, 300) };
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}
