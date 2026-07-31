"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Loader2, Upload } from "lucide-react";
import { uploadWritingImage } from "@/lib/writing/upload-image";

/** Corpo do popover de imagem: upload para o Storage ou inserção por URL. */
export function ImagePanel({
  editor,
  projectId,
  close,
}: {
  editor: Editor;
  projectId: string;
  close: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function insert(src: string) {
    editor.chain().focus().setImage({ src }).run();
    close();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const publicUrl = await uploadWritingImage(file, projectId);
      insert(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="btn btn-secondary h-9 w-full !text-xs"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {busy ? "Enviando…" : "Enviar do computador"}
      </button>

      <div className="flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
        <span className="h-px flex-1 bg-border-subtle" />
        ou
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <div className="space-y-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim()) {
              e.preventDefault();
              insert(url.trim());
            }
          }}
          placeholder="Colar URL da imagem"
          className="input h-9 w-full text-sm"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => url.trim() && insert(url.trim())}
          disabled={!url.trim()}
          className="btn btn-primary h-8 w-full !text-xs"
        >
          Inserir por URL
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
