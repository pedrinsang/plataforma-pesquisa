"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlus, Upload, Loader2 } from "lucide-react";
import { Popover } from "./primitives";
import { uploadWritingImage } from "@/lib/writing/upload-image";

/** Insere imagem por upload (Storage) ou por URL. */
export function ImageControl({ editor, projectId }: { editor: Editor; projectId: string }) {
  return (
    <Popover
      panelClassName="w-72 p-3"
      trigger={({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle}
          aria-label="Imagem"
          title="Inserir imagem"
          className={`grid size-8 place-items-center rounded-md transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] ${
            open ? "bg-accent-teal-soft text-accent-teal" : "text-text-dim hover:text-foreground"
          }`}
        >
          <ImagePlus size={16} />
        </button>
      )}
    >
      {(close) => <ImageForm editor={editor} projectId={projectId} close={close} />}
    </Popover>
  );
}

function ImageForm({
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

      <div className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.14em] text-text-dim">
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

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
