import { headers } from "next/headers";

/**
 * URL pública da aplicação, para montar links que saem daqui (e-mail de
 * convite, por exemplo). Prefere a variável de ambiente; sem ela, deduz do
 * cabeçalho da requisição — o que faz o link funcionar em `localhost` e em
 * deploys de preview sem configuração nenhuma.
 */
export async function getAppUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";

  const proto =
    h.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? "http" : "https");

  return `${proto}://${host}`;
}
