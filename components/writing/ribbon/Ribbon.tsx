"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  BarChart3,
  Baseline,
  BookMarked,
  Bold,
  Check,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Library,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RefreshCw,
  RemoveFormatting,
  Replace,
  Rows3,
  Ruler,
  Search,
  SeparatorHorizontal,
  Strikethrough,
  StickyNote,
  Table as TableIcon,
  Target,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { MenuDivider, MenuItem, MenuLabel, Popover } from "../ui";
import { HeaderFooterControl } from "../HeaderFooterControl";
import { ColorPanel } from "./ColorPanel";
import { LinkPanel } from "./LinkPanel";
import { ImagePanel } from "./ImagePanel";
import { TableMenu } from "./TableMenu";
import { FontSizeStepper } from "./FontSizeStepper";
import {
  RibbonBigButton,
  RibbonButton,
  RibbonGroup,
  RibbonInlineSep,
  RibbonReadout,
  RibbonSelectTrigger,
  RibbonSep,
} from "./primitives";
import type { RibbonTab } from "../RibbonTabs";
import {
  FONT_FAMILIES,
  LINE_HEIGHTS,
  PARAGRAPH_SPACINGS,
} from "@/lib/writing/editor-extensions";
import { refreshAllStatSources } from "@/lib/writing/extensions/stat-chart";

const BLOCK_STYLES = [
  { label: "Texto normal", level: 0 as const },
  { label: "Título 1", level: 1 as const },
  { label: "Título 2", level: 2 as const },
  { label: "Título 3", level: 3 as const },
  { label: "Título 4", level: 4 as const },
];

const CORMORANT = "var(--font-cormorant), Georgia, serif";
const LORA = "var(--font-lora), Georgia, serif";

function familyLabel(value: string | null): string {
  if (!value) return "Lora";
  return FONT_FAMILIES.find((f) => f.value === value)?.label.replace(" (padrão)", "") ?? "Fonte";
}

function spacingLabel(pt: number | null): string {
  if (pt == null) return "auto";
  return pt === 0 ? "0" : String(pt);
}

export type RibbonProps = {
  editor: Editor;
  tab: RibbonTab;
  projectId: string;
  /** Sinal do Ctrl+K para abrir o popover de link. */
  linkOpenSignal?: number;
  onInsertStat: () => void;
  /** Abre a biblioteca de referências no trilho da direita. */
  onOpenReferences: () => void;
  onFind: () => void;
  onReplace: () => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  header: string;
  footer: string;
  onHeaderFooterChange: (next: { header: string; footer: string }) => void;
  onDelete: () => void;
  wordCount: number;
  charCount: number;
  goal: number | null;
  onGoalChange: (goal: number | null) => void;
};

/**
 * Faixa de opções agrupada do editor em tela cheia. Cada aba mostra os grupos
 * do design (rótulo em versalete embaixo, separadores verticais entre grupos);
 * os controles são os mesmos comandos do TipTap que a barra antiga expunha.
 */
export function Ribbon(props: RibbonProps) {
  const { editor, tab } = props;

  const s = useEditorState({
    editor,
    selector: ({ editor }) => {
      let statLinks = 0;
      editor.state.doc.descendants((node) => {
        if (node.type.name === "statChart") statLinks += 1;
      });
      const block = editor.state.selection.$from.parent.attrs as {
        lineHeight?: string | null;
        spaceBefore?: number | null;
        spaceAfter?: number | null;
      };
      return {
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        bold: editor.isActive("bold"),
        italic: editor.isActive("italic"),
        underline: editor.isActive("underline"),
        strike: editor.isActive("strike"),
        superscript: editor.isActive("superscript"),
        subscript: editor.isActive("subscript"),
        blockquote: editor.isActive("blockquote"),
        bulletList: editor.isActive("bulletList"),
        orderedList: editor.isActive("orderedList"),
        link: editor.isActive("link"),
        table: editor.isActive("table"),
        alignLeft: editor.isActive({ textAlign: "left" }),
        alignCenter: editor.isActive({ textAlign: "center" }),
        alignRight: editor.isActive({ textAlign: "right" }),
        alignJustify: editor.isActive({ textAlign: "justify" }),
        headingLevel: [1, 2, 3, 4].find((l) => editor.isActive("heading", { level: l })) ?? 0,
        fontFamily: (editor.getAttributes("textStyle").fontFamily as string) ?? null,
        fontSize: parseInt(String(editor.getAttributes("textStyle").fontSize ?? ""), 10) || null,
        color: (editor.getAttributes("textStyle").color as string) ?? null,
        highlight: (editor.getAttributes("highlight").color as string) ?? null,
        lineHeight: block.lineHeight ?? null,
        spaceBefore: block.spaceBefore ?? null,
        spaceAfter: block.spaceAfter ?? null,
        statLinks,
      };
    },
  });

  const chain = () => editor.chain().focus();
  const currentBlock = BLOCK_STYLES.find((b) => b.level === s.headingLevel) ?? BLOCK_STYLES[0];

  return (
    <div className="fx-ribbon print:hidden" role="tabpanel" aria-label={`Faixa ${tab}`}>
      {tab === "Início" && (
        <>
          <RibbonGroup label="Histórico">
            <RibbonButton label="Desfazer (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
              <Undo2 size={17} />
            </RibbonButton>
            <RibbonButton label="Refazer (Ctrl+Y)" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
              <Redo2 size={17} />
            </RibbonButton>
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Estilo" gap={6}>
            <Popover
              panelClassName="w-44"
              trigger={(p) => (
                <RibbonSelectTrigger
                  {...p}
                  title="Estilo de parágrafo"
                  width={132}
                  label={currentBlock.label}
                  style={{ fontFamily: CORMORANT, fontSize: 15 }}
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
                          : { fontFamily: CORMORANT, fontSize: `${1.5 - (b.level - 1) * 0.15}rem` }
                      }
                    >
                      {b.label}
                    </MenuItem>
                  ))}
                  <MenuDivider />
                  <MenuItem
                    active={s.blockquote}
                    onClick={() => {
                      chain().toggleBlockquote().run();
                      close();
                    }}
                  >
                    <Quote size={14} /> Citação
                  </MenuItem>
                </>
              )}
            </Popover>
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Fonte" gap={6}>
            <Popover
              panelClassName="w-52"
              trigger={(p) => (
                <RibbonSelectTrigger
                  {...p}
                  title="Família de fonte"
                  width={116}
                  label={familyLabel(s.fontFamily)}
                  style={{ fontFamily: LORA, fontSize: 13 }}
                />
              )}
            >
              {(close) => (
                <>
                  {FONT_FAMILIES.map((f) => (
                    <MenuItem
                      key={f.value}
                      active={s.fontFamily === f.value}
                      onClick={() => {
                        chain().setFontFamily(f.value).run();
                        close();
                      }}
                      style={{ fontFamily: f.value }}
                    >
                      {f.label}
                    </MenuItem>
                  ))}
                  <MenuDivider />
                  <MenuItem
                    onClick={() => {
                      chain().unsetFontFamily().run();
                      close();
                    }}
                  >
                    Padrão
                  </MenuItem>
                </>
              )}
            </Popover>

            <FontSizeStepper value={s.fontSize} onChange={(size) => chain().setFontSize(`${size}px`).run()} />

            <span className="flex items-center gap-0.5">
              <RibbonButton label="Negrito (Ctrl+B)" active={s.bold} onClick={() => chain().toggleBold().run()}>
                <Bold size={15} />
              </RibbonButton>
              <RibbonButton label="Itálico (Ctrl+I)" active={s.italic} onClick={() => chain().toggleItalic().run()}>
                <Italic size={15} />
              </RibbonButton>
              <RibbonButton label="Sublinhado (Ctrl+U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
                <UnderlineIcon size={15} />
              </RibbonButton>
              <RibbonButton label="Tachado" active={s.strike} onClick={() => chain().toggleStrike().run()}>
                <Strikethrough size={15} />
              </RibbonButton>
              <RibbonButton label="Sobrescrito" active={s.superscript} onClick={() => chain().toggleSuperscript().run()}>
                <span style={{ fontFamily: LORA, fontSize: 12 }}>
                  x<sup style={{ fontSize: 8 }}>2</sup>
                </span>
              </RibbonButton>
              <RibbonButton label="Subscrito" active={s.subscript} onClick={() => chain().toggleSubscript().run()}>
                <span style={{ fontFamily: LORA, fontSize: 12 }}>
                  x<sub style={{ fontSize: 8 }}>2</sub>
                </span>
              </RibbonButton>
            </span>

            <span className="flex items-center gap-0.5">
              <Popover
                panelClassName="w-56 p-3"
                trigger={({ open, toggle, triggerRef }) => (
                  <button
                    ref={triggerRef}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggle}
                    className={`fx-ico ${open ? "is-open" : ""}`}
                    title="Cor do texto"
                    aria-label="Cor do texto"
                  >
                    <span className="flex flex-col items-center gap-[2px]">
                      <Baseline size={14} />
                      <span className="fx-swatch" style={{ background: s.color ?? "#eceae7" }} />
                    </span>
                  </button>
                )}
              >
                {(close) => (
                  <ColorPanel
                    value={s.color}
                    onSelect={(c) => chain().setColor(c).run()}
                    onClear={() => chain().unsetColor().run()}
                    close={close}
                  />
                )}
              </Popover>

              <Popover
                panelClassName="w-56 p-3"
                trigger={({ open, toggle, triggerRef }) => (
                  <button
                    ref={triggerRef}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={toggle}
                    className={`fx-ico ${open ? "is-open" : ""}`}
                    title="Cor de destaque"
                    aria-label="Cor de destaque"
                  >
                    <span className="flex flex-col items-center gap-[2px]">
                      <Highlighter size={14} />
                      <span className="fx-swatch" style={{ background: s.highlight ?? "var(--fx-gold)" }} />
                    </span>
                  </button>
                )}
              >
                {(close) => (
                  <ColorPanel
                    value={s.highlight}
                    onSelect={(c) => chain().setHighlight({ color: c }).run()}
                    onClear={() => chain().unsetHighlight().run()}
                    close={close}
                  />
                )}
              </Popover>
            </span>
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Parágrafo">
            <RibbonButton label="Alinhar à esquerda" active={s.alignLeft} onClick={() => chain().setTextAlign("left").run()}>
              <AlignLeft size={16} />
            </RibbonButton>
            <RibbonButton label="Centralizar" active={s.alignCenter} onClick={() => chain().setTextAlign("center").run()}>
              <AlignCenter size={16} />
            </RibbonButton>
            <RibbonButton label="Alinhar à direita" active={s.alignRight} onClick={() => chain().setTextAlign("right").run()}>
              <AlignRight size={16} />
            </RibbonButton>
            <RibbonButton label="Justificar" active={s.alignJustify} onClick={() => chain().setTextAlign("justify").run()}>
              <AlignJustify size={16} />
            </RibbonButton>
            <RibbonInlineSep />
            <RibbonButton label="Lista com marcadores" active={s.bulletList} onClick={() => chain().toggleBulletList().run()}>
              <List size={16} />
            </RibbonButton>
            <RibbonButton label="Lista numerada" active={s.orderedList} onClick={() => chain().toggleOrderedList().run()}>
              <ListOrdered size={16} />
            </RibbonButton>
            <RibbonButton label="Diminuir recuo" onClick={() => chain().outdent().run()}>
              <IndentDecrease size={16} />
            </RibbonButton>
            <RibbonButton label="Aumentar recuo" onClick={() => chain().indent().run()}>
              <IndentIncrease size={16} />
            </RibbonButton>
            <RibbonInlineSep />
            <LineHeightSelect editor={editor} value={s.lineHeight} />
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Edição">
            <RibbonButton label="Localizar (Ctrl+F)" onClick={props.onFind}>
              <Search size={16} />
            </RibbonButton>
            <RibbonButton label="Substituir (Ctrl+H)" onClick={props.onReplace}>
              <Replace size={16} />
            </RibbonButton>
            <RibbonButton
              label="Limpar formatação"
              onClick={() =>
                chain().unsetAllMarks().clearNodes().unsetLineHeight().unsetParagraphSpacing().run()
              }
            >
              <RemoveFormatting size={16} />
            </RibbonButton>
          </RibbonGroup>
        </>
      )}

      {tab === "Inserir" && (
        <>
          <RibbonGroup label="Objetos" gap={4}>
            <Popover
              panelClassName="w-52"
              trigger={({ open, toggle, triggerRef }) => (
                <button
                  ref={triggerRef}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggle}
                  className={`fx-big ${open || s.table ? "is-open" : ""}`}
                  title="Tabela"
                >
                  <TableIcon size={19} />
                  <span>Tabela</span>
                </button>
              )}
            >
              {(close) => <TableMenu editor={editor} close={close} />}
            </Popover>

            <Popover
              panelClassName="w-72 p-3"
              trigger={({ open, toggle, triggerRef }) => (
                <button
                  ref={triggerRef}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggle}
                  className={`fx-big ${open ? "is-open" : ""}`}
                  title="Imagem"
                >
                  <ImagePlus size={19} />
                  <span>Imagem</span>
                </button>
              )}
            >
              {(close) => <ImagePanel editor={editor} projectId={props.projectId} close={close} />}
            </Popover>

            <RibbonBigButton
              label="Estatística"
              title="Inserir gráfico ou estatística"
              icon={<BarChart3 size={19} />}
              onClick={props.onInsertStat}
            />

            <Popover
              openSignal={props.linkOpenSignal}
              panelClassName="w-72 p-3"
              trigger={({ open, toggle, triggerRef }) => (
                <button
                  ref={triggerRef}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggle}
                  className={`fx-big ${open || s.link ? "is-open" : ""}`}
                  title="Inserir link (Ctrl+K)"
                >
                  <Link2 size={19} />
                  <span>Link</span>
                </button>
              )}
            >
              {(close) => <LinkPanel editor={editor} active={s.link} close={close} />}
            </Popover>
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Referência" gap={4}>
            <RibbonBigButton
              label="Citação"
              title="Citação de referência — em breve"
              icon={<BookMarked size={19} />}
              onClick={() => {}}
              disabled
            />
            <RibbonBigButton
              label="Nota"
              title="Nota de rodapé — em breve"
              icon={<StickyNote size={19} />}
              onClick={() => {}}
              disabled
            />
            <RibbonBigButton
              label="Quebra"
              title="Quebra de página"
              icon={<SeparatorHorizontal size={19} />}
              onClick={() => chain().setPageBreak().run()}
            />
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Vínculos" gap={6}>
            <button
              type="button"
              className="fx-act"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => refreshAllStatSources()}
              title="Rebuscar os dados de todas as estatísticas embutidas"
            >
              <RefreshCw size={14} />
              Atualizar vínculos
            </button>
            <RibbonReadout icon={<Check size={11} style={{ color: "var(--fx-teal)" }} />}>
              {s.statLinks} {s.statLinks === 1 ? "figura vinculada" : "figuras vinculadas"}
            </RibbonReadout>
          </RibbonGroup>
        </>
      )}

      {tab === "Layout" && (
        <>
          <RibbonGroup label="Página" gap={4}>
            <RibbonBigButton
              label="Régua"
              title={props.showRuler ? "Ocultar régua" : "Mostrar régua"}
              icon={<Ruler size={19} />}
              onClick={props.onToggleRuler}
              active={props.showRuler}
            />
            <HeaderFooterControl
              header={props.header}
              footer={props.footer}
              onChange={props.onHeaderFooterChange}
              className="fx-big"
              icon={
                <>
                  <Rows3 size={19} />
                  <span>Cabeçalho</span>
                </>
              }
            />
            <RibbonBigButton
              label="Quebra"
              title="Quebra de página"
              icon={<SeparatorHorizontal size={19} />}
              onClick={() => chain().setPageBreak().run()}
            />
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Parágrafo" gap={6}>
            <LineHeightSelect editor={editor} value={s.lineHeight} />
            <SpacingSelect
              title="Espaço antes do parágrafo"
              value={s.spaceBefore}
              onSelect={(pt) => chain().setSpaceBefore(pt).run()}
            />
            <SpacingSelect
              title="Espaço depois do parágrafo"
              value={s.spaceAfter}
              onSelect={(pt) => chain().setSpaceAfter(pt).run()}
            />
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Documento" gap={6}>
            <button type="button" className="fx-act fx-act-danger" onClick={props.onDelete}>
              <Trash2 size={14} />
              Excluir documento
            </button>
          </RibbonGroup>
        </>
      )}

      {tab === "Revisão" && (
        <>
          <RibbonGroup label="Localizar" gap={4}>
            <RibbonBigButton label="Localizar" title="Localizar (Ctrl+F)" icon={<Search size={19} />} onClick={props.onFind} />
            <RibbonBigButton label="Substituir" title="Substituir (Ctrl+H)" icon={<Replace size={19} />} onClick={props.onReplace} />
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Contagem" gap={10}>
            <RibbonReadout>
              <span style={{ color: "var(--color-text)", fontSize: 11.5 }}>
                {props.wordCount.toLocaleString("pt-BR")} palavras
              </span>
            </RibbonReadout>
            <RibbonReadout>{props.charCount.toLocaleString("pt-BR")} caracteres</RibbonReadout>
          </RibbonGroup>
          <RibbonSep />

          <RibbonGroup label="Meta" gap={6}>
            <GoalControl goal={props.goal} onChange={props.onGoalChange} />
          </RibbonGroup>
        </>
      )}

      {tab === "Referências" && (
        <RibbonGroup label="Biblioteca" gap={4}>
          <RibbonBigButton label="Nova" title="Nova referência — em breve" icon={<Library size={19} />} onClick={() => {}} disabled />
          <RibbonBigButton
            label="Citar"
            title="Abrir a biblioteca do projeto para citar ou ler um artigo"
            icon={<BookMarked size={19} />}
            onClick={props.onOpenReferences}
          />
          <RibbonBigButton
            label="Bibliografia"
            title="Gerar bibliografia — em breve"
            icon={<SeparatorHorizontal size={19} />}
            onClick={() => {}}
            disabled
          />
          <RibbonReadout>a lista completa fica na aba Referências do projeto</RibbonReadout>
        </RibbonGroup>
      )}
    </div>
  );
}

/** Combo de espaçamento entre linhas (aparece em Início e em Layout). */
function LineHeightSelect({ editor, value }: { editor: Editor; value: string | null }) {
  const label = LINE_HEIGHTS.find((lh) => lh.value === value)?.label ?? "auto";
  return (
    <Popover
      align="end"
      panelClassName="w-40"
      trigger={(p) => (
        <RibbonSelectTrigger
          {...p}
          title="Espaçamento entre linhas"
          width={74}
          label={label}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontVariantNumeric: "tabular-nums" }}
        />
      )}
    >
      {(close) => (
        <>
          {LINE_HEIGHTS.map((lh) => (
            <MenuItem
              key={lh.value}
              active={value === lh.value}
              onClick={() => {
                editor.chain().focus().setLineHeight(lh.value).run();
                close();
              }}
            >
              {lh.label}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem
            onClick={() => {
              editor.chain().focus().unsetLineHeight().run();
              close();
            }}
          >
            Padrão
          </MenuItem>
        </>
      )}
    </Popover>
  );
}

/** Combo de espaço antes/depois do parágrafo, em pontos. */
function SpacingSelect({
  title,
  value,
  onSelect,
}: {
  title: string;
  value: number | null;
  onSelect: (pt: number) => void;
}) {
  return (
    <Popover
      align="end"
      panelClassName="w-40"
      trigger={(p) => (
        <RibbonSelectTrigger
          {...p}
          title={title}
          width={92}
          label={`${title.includes("antes") ? "antes" : "depois"} ${spacingLabel(value)}`}
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}
        />
      )}
    >
      {(close) => (
        <>
          <MenuLabel>{title}</MenuLabel>
          {PARAGRAPH_SPACINGS.map((sp) => (
            <MenuItem
              key={sp.value}
              active={value === sp.value}
              onClick={() => {
                onSelect(sp.value);
                close();
              }}
            >
              {sp.label}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}

/** Meta de palavras do documento (usada também pela barra de status). */
function GoalControl({
  goal,
  onChange,
}: {
  goal: number | null;
  onChange: (goal: number | null) => void;
}) {
  return (
    <Popover
      align="end"
      panelClassName="w-56 p-3"
      trigger={({ open, toggle, triggerRef }) => (
        <button
          ref={triggerRef}
          type="button"
          className="fx-act"
          onClick={toggle}
          aria-expanded={open}
          title="Meta de palavras do documento"
        >
          <Target size={14} />
          {goal ? `Meta: ${goal.toLocaleString("pt-BR")}` : "Definir meta"}
        </button>
      )}
    >
      {(close) => (
        <div className="space-y-2">
          <label className="block font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
            Meta de palavras
          </label>
          <input
            autoFocus
            type="number"
            min={1}
            defaultValue={goal ?? ""}
            placeholder="Ex.: 8000"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              const raw = (e.target as HTMLInputElement).value.trim();
              const n = Number(raw);
              onChange(raw === "" || !Number.isFinite(n) || n <= 0 ? null : n);
              close();
            }}
            className="input h-9 w-full text-sm"
          />
          <p className="text-[0.7rem] leading-relaxed text-text-dim">
            Enter para salvar. Deixe em branco para remover a meta.
          </p>
        </div>
      )}
    </Popover>
  );
}
