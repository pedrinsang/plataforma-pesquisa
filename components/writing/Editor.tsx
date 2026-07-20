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
          "prose prose-zinc dark:prose-invert prose-lg prose-headings:font-serif prose-headings:font-semibold prose-p:leading-relaxed max-w-none min-h-[62vh] rounded-2xl border border-border-subtle bg-surface px-8 py-10 shadow-card focus:outline-none sm:px-12",
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
