import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath =
    PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path)) ||
    request.nextUrl.pathname.startsWith("/forms/") ||
    // Bancos de ensaio (`/dev/...`): reproduzem defeitos de layout com documento
    // fixo e **sem nada do usuário**, então rodam sem sessão de propósito — pedir
    // login para medir paginação só atrapalharia. A porta é dupla: aqui o desvio
    // só é dispensado fora de produção, e a própria rota devolve 404 lá.
    (process.env.NODE_ENV !== "production" && request.nextUrl.pathname.startsWith("/dev/"));

  if (!user && !isPublicPath && request.nextUrl.pathname !== "/") {
    const redirectUrl = request.nextUrl.clone();
    // Guarda o destino para voltar depois de entrar — é o que faz o link de
    // convite (/convite/<código>) sobreviver ao desvio para o login.
    const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", target);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // `pdfjs/` são os assets do leitor de PDF (worker, CMaps, fontes-padrão):
    // arquivos de biblioteca, iguais para todo mundo e sem nada do usuário.
    // Fora daqui eles custariam um `getUser()` no Supabase por arquivo — e o
    // pdf.js busca vários por documento aberto.
    "/((?!_next/static|_next/image|favicon.ico|pdfjs/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
