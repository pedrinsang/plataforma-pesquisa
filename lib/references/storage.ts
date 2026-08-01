// Constantes do bucket dos arquivos de referência. Ficam num módulo neutro
// (sem cliente Supabase) para poderem ser usadas tanto no servidor quanto no
// navegador. Devem espelhar a migration references-library.

export const REFERENCE_BUCKET = "reference-files";
export const REFERENCE_MAX_BYTES = 50 * 1024 * 1024;

export const REFERENCE_ACCEPT =
  ".pdf,.doc,.docx,.rtf,.epub,.txt,.png,.jpg,.jpeg," +
  "application/pdf,application/msword," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/rtf,application/epub+zip,text/plain,image/png,image/jpeg";

export function formatFileSize(bytes: number | null): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
