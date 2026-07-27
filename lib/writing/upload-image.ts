import { createClient } from "@/lib/supabase/client";

const BUCKET = "writing-images";

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const fromType = file.type.split("/")[1];
  return fromType || "png";
}

/**
 * Envia uma imagem para o Storage e devolve a URL pública. Lança um erro com
 * mensagem amigável se o bucket ainda não existe (migration não aplicada).
 */
export async function uploadWritingImage(file: File, projectId: string): Promise<string> {
  const supabase = createClient();
  const ext = extensionFor(file);
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    if (/bucket.*not found/i.test(error.message)) {
      throw new Error(
        "O armazenamento de imagens ainda não foi configurado. Rode a migration writing-images (npx supabase db push).",
      );
    }
    throw new Error(error.message || "Falha ao enviar a imagem.");
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
