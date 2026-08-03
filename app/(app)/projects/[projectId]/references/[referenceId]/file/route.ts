import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REFERENCE_BUCKET } from "@/lib/references/storage";

// O bucket dos arquivos é privado, então não existe URL pública para o PDF.
// Este handler troca o id da referência por uma URL assinada de curta duração:
// se a RLS não deixar o usuário ler a linha, não há path — e não há download.
//
// Três modos, pelo query string:
//   (nenhum)  → redireciona para a URL assinada (visualizador do navegador)
//   ?dl=1     → idem, mas forçando o download do arquivo
//   ?raw=1    → devolve os **bytes** pela nossa origem, para o leitor de artigos
//               do editor: o pdf.js precisa ler o arquivo por fetch, e da nossa
//               origem isso não depende do CORS do Storage nem entrega a URL
//               assinada ao cliente.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; referenceId: string }> },
) {
  const { projectId, referenceId } = await params;
  const search = new URL(request.url).searchParams;
  // Sem "?dl=1" o PDF abre no visualizador do navegador; com, baixa o arquivo.
  const wantsDownload = search.get("dl") === "1";
  const wantsRaw = search.get("raw") === "1";
  const supabase = await createClient();

  const { data: reference } = await supabase
    .from("project_references")
    .select("file_path, file_name, file_mime")
    .eq("id", referenceId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!reference?.file_path) {
    return new NextResponse("Arquivo não encontrado.", { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from(REFERENCE_BUCKET)
    .createSignedUrl(
      reference.file_path,
      60,
      wantsDownload ? { download: reference.file_name ?? true } : undefined,
    );

  if (error || !signed) {
    return new NextResponse("Não foi possível abrir o arquivo.", { status: 502 });
  }

  if (wantsRaw) {
    const upstream = await fetch(signed.signedUrl);
    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Não foi possível ler o arquivo.", { status: 502 });
    }
    const length = upstream.headers.get("content-length");
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": reference.file_mime ?? "application/pdf",
        "Content-Disposition": "inline",
        // A URL assinada dura 60 s e o arquivo é privado: nada disso pode
        // encostar em cache compartilhado.
        "Cache-Control": "private, no-store",
        ...(length ? { "Content-Length": length } : {}),
      },
    });
  }

  return NextResponse.redirect(signed.signedUrl);
}
