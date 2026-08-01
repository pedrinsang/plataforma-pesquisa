import { createClient } from "@/lib/supabase/client";
import { REFERENCE_BUCKET, REFERENCE_MAX_BYTES } from "./storage";

export type UploadedFile = {
  path: string;
  name: string;
  size: number;
  mime: string | null;
};

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return file.type.split("/")[1] || "bin";
}

/**
 * Envia o arquivo da referência para o bucket privado. O primeiro segmento do
 * caminho é o project_id — é dele que as policies do Storage tiram a permissão
 * (ver migration references-library).
 */
export async function uploadReferenceFile(file: File, projectId: string): Promise<UploadedFile> {
  if (file.size > REFERENCE_MAX_BYTES) {
    throw new Error("O arquivo passa de 50 MB.");
  }

  const supabase = createClient();
  const path = `${projectId}/${crypto.randomUUID()}.${extensionFor(file)}`;

  const { error } = await supabase.storage.from(REFERENCE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    if (/bucket.*not found/i.test(error.message)) {
      throw new Error(
        "O armazenamento de referências ainda não foi configurado. Rode a migration references-library (npx supabase db push).",
      );
    }
    if (/mime type|not supported/i.test(error.message)) {
      throw new Error("Formato de arquivo não aceito. Use PDF, DOC/DOCX, RTF, EPUB, TXT ou imagem.");
    }
    throw new Error(error.message || "Falha ao enviar o arquivo.");
  }

  return { path, name: file.name, size: file.size, mime: file.type || null };
}

export async function removeReferenceFile(path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(REFERENCE_BUCKET).remove([path]);
}
