import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { REFERENCE_BUCKET } from "@/lib/references/storage";

// O bucket dos arquivos é privado, então não existe URL pública para o PDF.
// Este handler troca o id da referência por uma URL assinada de curta duração:
// se a RLS não deixar o usuário ler a linha, não há path — e não há download.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string; referenceId: string }> },
) {
  const { projectId, referenceId } = await params;
  // Sem "?dl=1" o PDF abre no visualizador do navegador; com, baixa o arquivo.
  const wantsDownload = new URL(request.url).searchParams.get("dl") === "1";
  const supabase = await createClient();

  const { data: reference } = await supabase
    .from("project_references")
    .select("file_path, file_name")
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

  return NextResponse.redirect(signed.signedUrl);
}
