"use client";

import { useCallback, useRef, useState } from "react";
import { Editor } from "@/components/writing/Editor";
import { WordCountBadge } from "@/components/writing/WordCountBadge";
import { updateDocumentContent, updateDocumentTitle, deleteDocument } from "@/lib/actions/documents";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="max-w-md text-lg font-medium"
        />
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Excluir este documento?")) deleteDocument(documentId, projectId);
          }}
        >
          Excluir
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <WordCountBadge documentId={documentId} wordCount={wordCount} initialGoal={initialWordGoal} />
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {saveStatus === "saving" ? "Salvando..." : "Salvo"}
        </span>
      </div>
      <Editor content={initialContent} onUpdate={handleEditorUpdate} />
    </div>
  );
}
