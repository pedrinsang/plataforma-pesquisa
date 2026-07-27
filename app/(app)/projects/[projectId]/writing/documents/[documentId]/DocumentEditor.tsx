"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import { Toolbar } from "@/components/writing/Toolbar";
import { StatPanel } from "@/components/writing/StatPanel";
import { WordCountBadge } from "@/components/writing/WordCountBadge";
import { buildEditorExtensions } from "@/lib/writing/editor-extensions";
import type { StatSourceKind } from "@/lib/writing/stat-sources";
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
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [panelOpen, setPanelOpen] = useState(false);
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

  const editor = useEditor({
    extensions: buildEditorExtensions(),
    content: (initialContent as never) ?? null,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "folium-editor prose prose-zinc dark:prose-invert prose-lg prose-headings:font-serif prose-headings:font-semibold prose-p:leading-relaxed max-w-none min-h-[62vh] rounded-2xl border border-border-subtle bg-surface px-8 py-10 shadow-card focus:outline-none sm:px-12",
      },
    },
    onCreate: ({ editor }) => setWordCount(countWords(editor.getText())),
    onUpdate: ({ editor }) => handleEditorUpdate(editor.getJSON(), editor.getText()),
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateDocumentTitle(documentId, projectId, value);
    }, 800);
  }

  function handleInsertStat(statId: string, kind: StatSourceKind) {
    editor?.chain().focus().insertStatChart({ statId, statType: kind }).run();
    setPanelOpen(false);
  }

  return (
    <div className="space-y-5">
      {/* Cabeçalho fixo: título + estado + barra de ferramentas */}
      <div className="sticky top-16 z-20 -mx-1 space-y-2 rounded-xl border border-border-subtle bg-surface/85 px-3 py-2.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
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
        {editor && <Toolbar editor={editor} projectId={projectId} onInsertStat={() => setPanelOpen(true)} />}
      </div>

      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex justify-end">
          <WordCountBadge documentId={documentId} wordCount={wordCount} initialGoal={initialWordGoal} />
        </div>
        <EditorContent editor={editor} />
      </div>

      <StatPanel
        open={panelOpen}
        projectId={projectId}
        onClose={() => setPanelOpen(false)}
        onInsert={handleInsertStat}
      />
    </div>
  );
}
