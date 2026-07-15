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
          "prose prose-zinc dark:prose-invert max-w-none min-h-[60vh] rounded-md border border-zinc-300 bg-white px-4 py-3 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900",
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
