import { lookup } from "node:dns/promises";

// Buscar metadados significa fazer o SERVIDOR abrir uma URL escolhida pelo
// usuário — o caminho clássico de SSRF (alguém cola http://169.254.169.254/…
// ou http://localhost:5432 e usa o nosso servidor como proxy para a rede
// interna). Então: só http/https, host resolvido e conferido contra as faixas
// privadas ANTES de conectar, redirecionos seguidos à mão (cada salto passa
// pela mesma checagem), timeout e teto de bytes lidos.

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_BYTES = 1_500_000; // 1,5 MB de HTML/JSON é folgado

export class UnsafeUrlError extends Error {}

function ipv4IsPrivate(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local (metadata de nuvem)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true; // multicast + reservado
  return false;
}

function ipIsPrivate(ip: string, family: number): boolean {
  if (family === 4) return ipv4IsPrivate(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("::ffff:")) {
    const mapped = v6.slice(7);
    return mapped.includes(".") ? ipv4IsPrivate(mapped) : true;
  }
  if (/^f[cd]/.test(v6)) return true; // unique local fc00::/7
  if (/^fe[89ab]/.test(v6)) return true; // link-local fe80::/10
  if (v6.startsWith("ff")) return true; // multicast
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Link inválido.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Só links http(s) podem ser importados.");
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(host)) {
    throw new UnsafeUrlError("Esse endereço não pode ser acessado.");
  }

  const addresses = await lookup(host, { all: true, verbatim: true }).catch(() => []);
  if (addresses.length === 0) throw new UnsafeUrlError("Não foi possível resolver esse endereço.");
  if (addresses.some((a) => ipIsPrivate(a.address, a.family))) {
    throw new UnsafeUrlError("Esse endereço não pode ser acessado.");
  }

  return url;
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder("utf-8");
  let out = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    out += decoder.decode(value, { stream: true });
    if (total >= maxBytes) {
      await reader.cancel();
      break;
    }
  }
  return out + decoder.decode();
}

/**
 * GET com proteção de SSRF, timeout e teto de tamanho. Devolve o corpo como
 * texto (ou null quando o status não é 2xx).
 */
export async function safeGet(
  rawUrl: string,
  opts: { accept?: string; maxBytes?: number; timeoutMs?: number } = {},
): Promise<{ body: string; finalUrl: string; contentType: string } | null> {
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  let target = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(target);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      headers: {
        // O Crossref/NCBI pedem um User-Agent identificável; sites comuns
        // devolvem HTML melhor quando não parecemos um bot anônimo.
        "user-agent": "Folium/0.1 (plataforma de pesquisa; +https://folium-tau.vercel.app)",
        accept: opts.accept ?? "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      },
    }).catch(() => null);

    if (!res) return null;

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      target = new URL(location, url).toString();
      continue;
    }

    if (!res.ok) return null;

    return {
      body: await readCapped(res, maxBytes),
      finalUrl: url.toString(),
      contentType: res.headers.get("content-type") ?? "",
    };
  }

  return null;
}
