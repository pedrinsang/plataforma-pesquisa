// Helpers puros do código de convite — sem `node:crypto`, então o cliente pode
// importar (a geração fica em `code.ts`, que só roda no servidor).

/** Forma canônica: maiúsculas, sem hifens/espaços (o banco normaliza igual). */
export function normalizeInviteCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Formato de exibição (`XXXX-XXXX-XXXX`) a partir de qualquer entrada. */
export function formatInviteCode(code: string): string {
  const raw = normalizeInviteCode(code);
  return (raw.match(/.{1,4}/g) ?? []).join("-");
}

export function isValidInviteCode(code: string): boolean {
  const raw = normalizeInviteCode(code);
  return raw.length >= 12 && raw.length <= 40;
}

export function inviteLink(appUrl: string, code: string): string {
  return `${appUrl.replace(/\/$/, "")}/convite/${normalizeInviteCode(code)}`;
}
