import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentEditor } from "./DocumentEditor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ projectId: string; documentId: string }>;
}) {
  const { projectId, documentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: document } = await supabase
    .from("documents")
    .select("id, title, content_json, word_goal")
    .eq("id", documentId)
    .single();

  if (!document) notFound();

  // Cabeçalho/rodapé em busca separada e tolerante: enquanto a migration
  // `20260728120000_document_header_footer` não roda (npx supabase db push), as
  // colunas não existem — aqui isso apenas mantém os campos vazios, sem quebrar.
  const { data: headerFooter } = await supabase
    .from("documents")
    .select("header_text, footer_text")
    .eq("id", documentId)
    .single();

  // Mesma tolerância para a configuração de página
  // (`20260806130000_document_page_setup`): sem as colunas, o editor cai no
  // padrão de 2,5 cm e entrelinha 1, que é como ele sempre desenhou.
  const { data: pageSetup } = await supabase
    .from("documents")
    .select("margin_top, margin_right, margin_bottom, margin_left, line_height")
    .eq("id", documentId)
    .single();

  // O controle de viúvas e órfãs veio depois, em migration própria
  // (`20260807120000_document_widow_control`), então tem `select` próprio: junto
  // com as margens, uma coluna faltando derrubaria a leitura das duas coisas e o
  // documento abriria com a margem errada. Sem a coluna, fica desligado — que é
  // o padrão dela.
  const { data: widow } = await supabase
    .from("documents")
    .select("widow_control")
    .eq("id", documentId)
    .single();

  return (
    <DocumentEditor
      documentId={document.id}
      projectId={projectId}
      initialTitle={document.title}
      initialContent={document.content_json as object}
      initialWordGoal={document.word_goal}
      initialHeader={headerFooter?.header_text ?? null}
      initialFooter={headerFooter?.footer_text ?? null}
      initialPageSetup={
        pageSetup
          ? {
              margins: {
                top: Number(pageSetup.margin_top),
                right: Number(pageSetup.margin_right),
                bottom: Number(pageSetup.margin_bottom),
                left: Number(pageSetup.margin_left),
              },
              lineHeight:
                pageSetup.line_height === null ? null : Number(pageSetup.line_height),
              widowControl: widow?.widow_control === true,
            }
          : null
      }
      userEmail={user?.email ?? ""}
    />
  );
}
