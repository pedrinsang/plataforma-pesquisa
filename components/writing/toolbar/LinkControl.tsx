"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Link2, Link2Off } from "lucide-react";
import { Popover, ToolbarButton } from "./primitives";

/** Insere/edita/remove links via um pequeno popover com campo de URL. */
export function LinkControl({ editor, active }: { editor: Editor; active: boolean }) {
  return (
    <Popover
      panelClassName="w-72 p-3"
      trigger={({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle}
          aria-label="Link"
          aria-pressed={active}
          title="Inserir link"
          className={`grid size-8 place-items-center rounded-md transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] ${
            active || open ? "bg-accent-teal-soft text-accent-teal" : "text-text-dim hover:text-foreground"
          }`}
        >
          <Link2 size={16} />
        </button>
      )}
    >
      {(close) => <LinkForm editor={editor} active={active} close={close} />}
    </Popover>
  );
}

function LinkForm({ editor, active, close }: { editor: Editor; active: boolean; close: () => void }) {
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
      <label className="block text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
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
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={apply} className="btn btn-primary h-8 flex-1 !text-xs">
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
            className="grid size-8 place-items-center rounded-md text-text-dim transition-colors hover:bg-red-500/10 hover:text-red-600"
          >
            <Link2Off size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// Reexport para conveniência do Toolbar.
export { ToolbarButton };
