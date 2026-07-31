"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link2Off } from "lucide-react";

/** Corpo do popover de link: campo de URL, aplicar e remover. */
export function LinkPanel({
  editor,
  active,
  close,
}: {
  editor: Editor;
  active: boolean;
  close: () => void;
}) {
  const [url, setUrl] = useState<string>(() => editor.getAttributes("link").href ?? "");

  function apply() {
    const href = url.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      const normalized = /^(https?:|mailto:|tel:|\/)/i.test(href) ? href : `https://${href}`;
      editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    }
    close();
  }

  return (
    <div className="space-y-2">
      <label className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
        Endereço do link
      </label>
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
        placeholder="https://exemplo.com"
        className="input h-9 w-full text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={apply}
          className="btn btn-primary h-8 flex-1 !text-xs"
        >
          Aplicar
        </button>
        {active && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              close();
            }}
            title="Remover link"
            className="grid size-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Link2Off size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
