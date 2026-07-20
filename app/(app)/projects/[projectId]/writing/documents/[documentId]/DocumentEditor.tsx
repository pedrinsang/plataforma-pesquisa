"use client";

import { useCallback, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { Editor } from "@/components/writing/Editor";
import { WordCountBadge } from "@/components/writing/WordCountBadge";
import { updateDocumentContent, updateDocumentTitle, deleteDocument } from "@/lib/actions/documents";
import { cn } from "@/lib/utils/cn";

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

export function DocumentEditor({
  documentId,
  projectId,
  initialTitle,
  initialContent,
  initialWordGoal,
}: {
  documentId: string;
  projectId: string;
  initialTitle: string;
  initialContent: object;
  initialWordGoal: number | null;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [wordCount, setWordCount] = useState(() => countWords(""));
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorUpdate = useCallback(
    (json: object, text: string) => {
      setWordCount(countWords(text));
      setSaveStatus("saving");
      if (contentTimer.current) clearTimeout(contentTimer.current);
      contentTimer.current = setTimeout(async () => {
        await updateDocumentContent(documentId, json);
        setSaveStatus("saved");
      }, 800);
    },
    [documentId],
  );

  function handleTitleChange(value: string) {
    setTitle(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateDocumentTitle(documentId, projectId, value);
    }, 800);
  }

  return (
    <div className="space-y-6">
      {/* Barra do editor: título + estado, gruda no topo ao rolar */}
      <div className="sticky top-16 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface/85 px-4 py-2.5 backdrop-blur-md">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Documento sem título"
          className="min-w-0 flex-1 bg-transparent font-serif text-lg font-semibold text-foreground placeholder:text-text-dim/60 focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wide",
              saveStatus === "saving" ? "text-accent-gold" : "text-text-dim",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                saveStatus === "saving" ? "animate-pulse bg-accent-gold" : "bg-accent-teal",
              )}
            />
            {saveStatus === "saving" ? "Salvando" : "Salvo"}
          </span>
          <button
            type="button"
            onClick={() => {
              if (confirm("Excluir este documento?")) deleteDocument(documentId, projectId);
            }}
            aria-label="Excluir documento"
            title="Excluir documento"
            className="rounded-lg p-1.5 text-text-dim transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex justify-end">
          <WordCountBadge documentId={documentId} wordCount={wordCount} initialGoal={initialWordGoal} />
        </div>
        <Editor content={initialContent} onUpdate={handleEditorUpdate} />
      </div>
    </div>
  );
}
