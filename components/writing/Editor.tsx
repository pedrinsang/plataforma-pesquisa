"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

export function Editor({
  content,
  onUpdate,
}: {
  content: object;
  onUpdate: (json: object, text: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content as never,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert prose-headings:font-serif max-w-none min-h-[60vh] rounded-xl border border-border-subtle bg-surface px-5 py-4 focus:outline-none",
      },
    },
    onCreate: ({ editor }) => {
      onUpdate(editor.getJSON(), editor.getText());
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON(), editor.getText());
    },
  });

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return <EditorContent editor={editor} />;
}
