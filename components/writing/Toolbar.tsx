"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Baseline,
  Highlighter,
  RemoveFormatting,
  MoreHorizontal,
  BarChart3,
  SeparatorHorizontal,
} from "lucide-react";
import {
  ToolbarButton,
  ToolbarGroup,
  Divider,
  Popover,
  DropdownTrigger,
  MenuItem,
} from "./toolbar/primitives";
import { ColorControl } from "./toolbar/ColorControl";
import { FontSizeControl } from "./toolbar/FontSizeControl";
import { LinkControl } from "./toolbar/LinkControl";
import { ImageControl } from "./toolbar/ImageControl";
import { TableControl } from "./toolbar/TableControl";
import { FONT_FAMILIES, LINE_HEIGHTS, PARAGRAPH_SPACINGS } from "@/lib/writing/editor-extensions";

const BLOCK_STYLES = [
  { label: "Texto normal", level: 0 as const },
  { label: "Título 1", level: 1 as const },
  { label: "Título 2", level: 2 as const },
  { label: "Título 3", level: 3 as const },
  { label: "Título 4", level: 4 as const },
];

function familyLabel(value: string | null): string {
  if (!value) return "Fonte";
  const match = FONT_FAMILIES.find((f) => f.value === value);
  return match?.label ?? "Fonte";
}

export function Toolbar({
  editor,
  projectId,
  onInsertStat,
  linkOpenSignal,
}: {
  editor: Editor;
  projectId: string;
  onInsertStat: () => void;
  /** Incrementado pelo Ctrl+K no editor para abrir o popover de link. */
  linkOpenSignal?: number;
}) {
  // Estado reativo: re-renderiza a barra a cada mudança de seleção/conteúdo.
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      superscript: editor.isActive("superscript"),
      subscript: editor.isActive("subscript"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      link: editor.isActive("link"),
      alignLeft: editor.isActive({ textAlign: "left" }),
      alignCenter: editor.isActive({ textAlign: "center" }),
      alignRight: editor.isActive({ textAlign: "right" }),
      alignJustify: editor.isActive({ textAlign: "justify" }),
      headingLevel: [1, 2, 3, 4].find((l) => editor.isActive("heading", { level: l })) ?? 0,
      fontFamily: (editor.getAttributes("textStyle").fontFamily as string) ?? null,
      fontSize: parseInt(String(editor.getAttributes("textStyle").fontSize ?? ""), 10) || null,
      color: (editor.getAttributes("textStyle").color as string) ?? null,
      highlight: (editor.getAttributes("highlight").color as string) ?? null,
    }),
  });

  const chain = () => editor.chain().focus();

  const ALIGN_OPTIONS = [
    { value: "left", icon: AlignLeft, label: "Alinhar à esquerda", active: s.alignLeft },
    { value: "center", icon: AlignCenter, label: "Centralizar", active: s.alignCenter },
    { value: "right", icon: AlignRight, label: "Alinhar à direita", active: s.alignRight },
    { value: "justify", icon: AlignJustify, label: "Justificar", active: s.alignJustify },
  ] as const;

  const currentBlock = BLOCK_STYLES.find((b) => b.level === s.headingLevel) ?? BLOCK_STYLES[0];

  return (
    <div className="flex flex-wrap items-center gap-y-1 rounded-xl border border-border-subtle bg-surface/90 px-2 py-1.5 backdrop-blur-md">
      {/* Histórico */}
      <ToolbarGroup>
        <ToolbarButton label="Desfazer" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton label="Refazer" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
          <Redo2 size={16} />
        </ToolbarButton>
      </ToolbarGroup>
      <Divider />

      {/* Estilo de bloco */}
      <ToolbarGroup>
        <Popover
          panelClassName="w-44"
          trigger={(p) => (
            <DropdownTrigger
              {...p}
              title="Estilo de parágrafo"
              width="w-32"
              label={currentBlock.label}
            />
          )}
        >
          {(close) => (
            <>
              {BLOCK_STYLES.map((b) => (
                <MenuItem
                  key={b.level}
                  active={b.level === s.headingLevel}
                  onClick={() => {
                    if (b.level === 0) chain().setParagraph().run();
                    else chain().toggleHeading({ level: b.level as 1 | 2 | 3 | 4 }).run();
                    close();
                  }}
                  style={
                    b.level === 0
                      ? undefined
                      : { fontFamily: "var(--font-cormorant), Georgia, serif", fontSize: `${1.5 - (b.level - 1) * 0.15}rem` }
                  }
                >
                  {b.label}
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-border-subtle" />
              <MenuItem active={editor.isActive("blockquote")} onClick={() => { chain().toggleBlockquote().run(); close(); }}>
                Citação
              </MenuItem>
            </>
          )}
        </Popover>
      </ToolbarGroup>
      <Divider />

      {/* Fonte */}
      <ToolbarGroup>
        <Popover
          panelClassName="w-52"
          trigger={(p) => (
            <DropdownTrigger {...p} title="Família de fonte" width="w-28" label={familyLabel(s.fontFamily)} />
          )}
        >
          {(close) => (
            <>
              {FONT_FAMILIES.map((f) => (
                <MenuItem
                  key={f.value}
                  active={s.fontFamily === f.value}
                  onClick={() => { chain().setFontFamily(f.value).run(); close(); }}
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-border-subtle" />
              <MenuItem onClick={() => { chain().unsetFontFamily().run(); close(); }}>Padrão</MenuItem>
            </>
          )}
        </Popover>
        <FontSizeControl
          value={s.fontSize}
          onChange={(size) => chain().setFontSize(`${size}px`).run()}
        />
      </ToolbarGroup>
      <Divider />

      {/* Marcas inline */}
      <ToolbarGroup>
        <ToolbarButton label="Negrito (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton label="Itálico (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton label="Sublinhado (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton label="Tachado" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>
      </ToolbarGroup>
      <Divider />

      {/* Cores */}
      <ToolbarGroup>
        <ColorControl
          title="Cor do texto"
          value={s.color}
          onSelect={(c) => chain().setColor(c).run()}
          onClear={() => chain().unsetColor().run()}
          icon={(c) => (
            <span className="flex flex-col items-center">
              <Baseline size={15} />
              <span className="mt-[1px] h-[3px] w-4 rounded-sm" style={{ background: c ?? "var(--color-text)" }} />
            </span>
          )}
        />
        <ColorControl
          title="Cor de destaque"
          value={s.highlight}
          onSelect={(c) => chain().setHighlight({ color: c }).run()}
          onClear={() => chain().unsetHighlight().run()}
          icon={(c) => (
            <span className="flex flex-col items-center">
              <Highlighter size={15} />
              <span className="mt-[1px] h-[3px] w-4 rounded-sm" style={{ background: c ?? "var(--color-accent-gold)" }} />
            </span>
          )}
        />
      </ToolbarGroup>
      <Divider />

      {/* Alinhamento */}
      <ToolbarGroup>
        {ALIGN_OPTIONS.map(({ value, icon: Icon, label, active }) => (
          <ToolbarButton key={value} label={label} active={active} onClick={() => chain().setTextAlign(value).run()}>
            <Icon size={16} />
          </ToolbarButton>
        ))}
      </ToolbarGroup>
      <Divider />

      {/* Listas e recuo */}
      <ToolbarGroup>
        <ToolbarButton label="Lista com marcadores" active={s.bulletList} onClick={() => chain().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton label="Lista numerada" active={s.orderedList} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton label="Diminuir recuo" onClick={() => chain().outdent().run()}>
          <IndentDecrease size={16} />
        </ToolbarButton>
        <ToolbarButton label="Aumentar recuo" onClick={() => chain().indent().run()}>
          <IndentIncrease size={16} />
        </ToolbarButton>
      </ToolbarGroup>
      <Divider />

      {/* Inserir */}
      <ToolbarGroup>
        <LinkControl editor={editor} active={s.link} openSignal={linkOpenSignal} />
        <ImageControl editor={editor} projectId={projectId} />
        <TableControl editor={editor} />
        <ToolbarButton label="Inserir gráfico ou estatística" onClick={onInsertStat}>
          <BarChart3 size={16} />
        </ToolbarButton>
      </ToolbarGroup>
      <Divider />

      {/* Mais (secundários / overflow) */}
      <ToolbarGroup>
        <Popover
          align="end"
          panelClassName="w-52"
          trigger={(p) => (
            <button
              ref={p.triggerRef}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={p.toggle}
              aria-label="Mais opções"
              title="Mais opções"
              className={`grid size-8 place-items-center rounded-md transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)] ${
                p.open ? "bg-accent-teal-soft text-accent-teal" : "text-text-dim hover:text-foreground"
              }`}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        >
          {(close) => (
            <div className="space-y-0.5">
              <MenuItem active={s.superscript} onClick={() => chain().toggleSuperscript().run()}>
                <SuperscriptIcon size={14} /> Sobrescrito
              </MenuItem>
              <MenuItem active={s.subscript} onClick={() => chain().toggleSubscript().run()}>
                <SubscriptIcon size={14} /> Subscrito
              </MenuItem>
              <div className="my-1 h-px bg-border-subtle" />
              <p className="px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-text-dim">
                Espaçamento entre linhas
              </p>
              {LINE_HEIGHTS.map((lh) => (
                <MenuItem key={lh.value} onClick={() => chain().setLineHeight(lh.value).run()}>
                  {lh.label}
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-border-subtle" />
              <p className="px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-text-dim">
                Espaço antes do parágrafo
              </p>
              <div className="grid grid-cols-4 gap-0.5 px-1.5 pb-1">
                {PARAGRAPH_SPACINGS.map((sp) => (
                  <button
                    key={`before-${sp.value}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chain().setSpaceBefore(sp.value).run()}
                    title={`Espaço antes: ${sp.label}`}
                    className="rounded-md px-1 py-1 text-center text-xs text-foreground transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                  >
                    {sp.value === 0 ? "0" : sp.value}
                  </button>
                ))}
              </div>
              <p className="px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-text-dim">
                Espaço depois do parágrafo
              </p>
              <div className="grid grid-cols-4 gap-0.5 px-1.5 pb-1">
                {PARAGRAPH_SPACINGS.map((sp) => (
                  <button
                    key={`after-${sp.value}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => chain().setSpaceAfter(sp.value).run()}
                    title={`Espaço depois: ${sp.label}`}
                    className="rounded-md px-1 py-1 text-center text-xs text-foreground transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                  >
                    {sp.value === 0 ? "0" : sp.value}
                  </button>
                ))}
              </div>
              <div className="my-1 h-px bg-border-subtle" />
              <MenuItem onClick={() => { chain().setPageBreak().run(); close(); }}>
                <SeparatorHorizontal size={14} /> Quebra de página
              </MenuItem>
              <MenuItem
                onClick={() => {
                  chain().unsetAllMarks().clearNodes().unsetLineHeight().unsetParagraphSpacing().run();
                  close();
                }}
              >
                <RemoveFormatting size={14} /> Limpar formatação
              </MenuItem>
            </div>
          )}
        </Popover>
      </ToolbarGroup>
    </div>
  );
}
