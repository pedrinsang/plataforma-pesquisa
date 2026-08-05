"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDownToLine,
  ArrowUpToLine,
  Captions,
  ChevronsLeftRight,
  Columns3,
  PanelLeft,
  PanelTop,
  Quote,
  Rows3,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
} from "lucide-react";
import { MenuDivider, MenuItem, MenuLabel, Popover } from "../ui";
import {
  RibbonButton,
  RibbonGroup,
  RibbonInlineSep,
  RibbonSelectTrigger,
  RibbonSep,
} from "./primitives";
import {
  DEFAULT_TABLE_ATTRS,
  TABLE_ALIGNS,
  TABLE_DENSITIES,
  TABLE_LABELS,
  TABLE_PRESETS,
  TABLE_SIZES,
  TABLE_WIDTHS,
  type FoliumTableAttrs,
} from "@/lib/writing/table-style";

const MONO = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.04em" } as const;

/**
 * Aba contextual "Tabela" — só existe quando o cursor está dentro de uma.
 *
 * É aqui que a tabela deixa de ser um bloco pronto e vira algo que se adequa à
 * norma de cada revista: o desenho das réguas, a densidade, o corpo em pontos,
 * a legenda numerada (rótulo e posição) e o alinhamento por coluna — que é como
 * uma coluna de números fica alinhada à direita sem tocar célula por célula.
 */
export function TableTools({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) => {
      const table = editor.getAttributes("table") as Partial<FoliumTableAttrs>;
      const cell = editor.getAttributes("tableCell") as { align?: string; valign?: string };
      const header = editor.getAttributes("tableHeader") as { align?: string; valign?: string };
      return {
        ...DEFAULT_TABLE_ATTRS,
        ...table,
        cellAlign: cell.align ?? header.align ?? null,
        cellValign: cell.valign ?? header.valign ?? null,
      };
    },
  });

  const chain = () => editor.chain().focus();
  const set = (attrs: Partial<FoliumTableAttrs>) => chain().setTableAttributes(attrs).run();

  const preset = TABLE_PRESETS.find((p) => p.value === s.preset) ?? TABLE_PRESETS[0];
  const density = TABLE_DENSITIES.find((d) => d.value === s.density) ?? TABLE_DENSITIES[1];

  return (
    <>
      <RibbonGroup label="Desenho" gap={6}>
        <Popover
          panelClassName="w-64"
          trigger={(p) => (
            <RibbonSelectTrigger
              {...p}
              title="Estilo das réguas da tabela"
              width={140}
              label={preset.label}
              style={{ fontFamily: "var(--font-lora), Georgia, serif", fontSize: 13 }}
            />
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Estilo da tabela</MenuLabel>
              {TABLE_PRESETS.map((p) => (
                <MenuItem
                  key={p.value}
                  active={p.value === s.preset}
                  onClick={() => {
                    set({ preset: p.value });
                    close();
                  }}
                >
                  <span className="flex flex-col gap-0.5">
                    <span>{p.label}</span>
                    <span className="text-[0.68rem] leading-snug text-text-dim">{p.hint}</span>
                  </span>
                </MenuItem>
              ))}
            </>
          )}
        </Popover>

        <RibbonButton
          label="Faixa alternada nas linhas"
          active={s.zebra}
          onClick={() => set({ zebra: !s.zebra })}
        >
          <Rows3 size={16} />
        </RibbonButton>

        <Popover
          align="end"
          panelClassName="w-44"
          trigger={(p) => (
            <RibbonSelectTrigger {...p} title="Densidade das células" width={92} label={density.label} style={MONO} />
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Densidade</MenuLabel>
              {TABLE_DENSITIES.map((d) => (
                <MenuItem
                  key={d.value}
                  active={d.value === s.density}
                  onClick={() => {
                    set({ density: d.value });
                    close();
                  }}
                >
                  {d.label}
                </MenuItem>
              ))}
            </>
          )}
        </Popover>

        <Popover
          align="end"
          panelClassName="w-40"
          trigger={(p) => (
            <RibbonSelectTrigger
              {...p}
              title="Corpo da tabela, em pontos"
              width={72}
              label={`${s.size ?? 10} pt`}
              style={{ ...MONO, fontVariantNumeric: "tabular-nums" }}
            />
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Corpo da tabela</MenuLabel>
              {TABLE_SIZES.map((pt) => (
                <MenuItem
                  key={pt}
                  active={(s.size ?? 10) === pt}
                  onClick={() => {
                    set({ size: pt === 10 ? null : pt });
                    close();
                  }}
                >
                  {pt} pt
                </MenuItem>
              ))}
            </>
          )}
        </Popover>
      </RibbonGroup>
      <RibbonSep />

      <RibbonGroup label="Legenda" gap={4}>
        <RibbonButton
          label={s.caption == null ? "Adicionar legenda" : "Remover legenda"}
          active={s.caption != null}
          onClick={() => set({ caption: s.caption == null ? "" : null })}
        >
          <Captions size={16} />
        </RibbonButton>
        <RibbonButton
          label={s.source == null ? "Adicionar linha de fonte" : "Remover linha de fonte"}
          active={s.source != null}
          onClick={() => set({ source: s.source == null ? "" : null })}
        >
          <Quote size={16} />
        </RibbonButton>
        <RibbonButton
          label={s.captionPlacement === "top" ? "Legenda acima da tabela" : "Legenda abaixo da tabela"}
          active={s.captionPlacement === "bottom"}
          onClick={() => set({ captionPlacement: s.captionPlacement === "top" ? "bottom" : "top" })}
        >
          {s.captionPlacement === "top" ? <ArrowUpToLine size={16} /> : <ArrowDownToLine size={16} />}
        </RibbonButton>

        <Popover
          align="end"
          panelClassName="w-56"
          trigger={(p) => (
            <RibbonSelectTrigger
              {...p}
              title="Rótulo e numeração da legenda"
              width={92}
              label={s.label === "" ? "sem rótulo" : `${s.label} n`}
              style={MONO}
            />
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Rótulo da legenda</MenuLabel>
              {TABLE_LABELS.map((l) => (
                <MenuItem
                  key={l.value}
                  active={l.value === s.label}
                  onClick={() => {
                    set({ label: l.value });
                    close();
                  }}
                >
                  {l.label}
                </MenuItem>
              ))}
              <MenuDivider />
              <p className="px-2.5 py-1 text-[0.7rem] leading-relaxed text-text-dim">
                O número é do documento: entra sozinho e se refaz quando outra
                tabela nasce antes desta.
              </p>
            </>
          )}
        </Popover>
      </RibbonGroup>
      <RibbonSep />

      <RibbonGroup label="Cabeçalho e células">
        <RibbonButton label="Linha de cabeçalho" onClick={() => chain().toggleHeaderRow().run()}>
          <PanelTop size={16} />
        </RibbonButton>
        <RibbonButton label="Coluna de cabeçalho" onClick={() => chain().toggleHeaderColumn().run()}>
          <PanelLeft size={16} />
        </RibbonButton>
        <RibbonInlineSep />
        <RibbonButton
          label="Coluna à esquerda"
          active={s.cellAlign === "left" || s.cellAlign == null}
          onClick={() => chain().setTableColumnAlign("left").run()}
        >
          <AlignLeft size={16} />
        </RibbonButton>
        <RibbonButton
          label="Coluna centralizada"
          active={s.cellAlign === "center"}
          onClick={() => chain().setTableColumnAlign("center").run()}
        >
          <AlignCenter size={16} />
        </RibbonButton>
        <RibbonButton
          label="Coluna à direita (números)"
          active={s.cellAlign === "right"}
          onClick={() => chain().setTableColumnAlign("right").run()}
        >
          <AlignRight size={16} />
        </RibbonButton>
        <RibbonInlineSep />
        <RibbonButton
          label="Alinhar ao topo da célula"
          active={s.cellValign == null || s.cellValign === "top"}
          onClick={() => chain().setTableCellVerticalAlign("top").run()}
        >
          <AlignVerticalJustifyStart size={16} />
        </RibbonButton>
        <RibbonButton
          label="Centralizar na altura da célula"
          active={s.cellValign === "middle"}
          onClick={() => chain().setTableCellVerticalAlign("middle").run()}
        >
          <AlignVerticalJustifyCenter size={16} />
        </RibbonButton>
        <RibbonButton
          label="Alinhar à base da célula"
          active={s.cellValign === "bottom"}
          onClick={() => chain().setTableCellVerticalAlign("bottom").run()}
        >
          <AlignVerticalJustifyEnd size={16} />
        </RibbonButton>
        <RibbonInlineSep />
        <RibbonButton label="Mesclar células" onClick={() => chain().mergeCells().run()}>
          <TableCellsMerge size={16} />
        </RibbonButton>
        <RibbonButton label="Dividir célula" onClick={() => chain().splitCell().run()}>
          <TableCellsSplit size={16} />
        </RibbonButton>
      </RibbonGroup>
      <RibbonSep />

      <RibbonGroup label="Linhas e colunas">
        <RibbonButton label="Inserir linha acima" onClick={() => chain().addRowBefore().run()}>
          <span className="flex items-center gap-[1px]">
            <Rows3 size={15} />
            <ArrowUpToLine size={10} />
          </span>
        </RibbonButton>
        <RibbonButton label="Inserir linha abaixo" onClick={() => chain().addRowAfter().run()}>
          <span className="flex items-center gap-[1px]">
            <Rows3 size={15} />
            <ArrowDownToLine size={10} />
          </span>
        </RibbonButton>
        <RibbonButton label="Inserir coluna à esquerda" onClick={() => chain().addColumnBefore().run()}>
          <span className="flex items-center gap-[1px]">
            <Columns3 size={15} />
            <AlignLeft size={10} />
          </span>
        </RibbonButton>
        <RibbonButton label="Inserir coluna à direita" onClick={() => chain().addColumnAfter().run()}>
          <span className="flex items-center gap-[1px]">
            <Columns3 size={15} />
            <AlignRight size={10} />
          </span>
        </RibbonButton>
        <RibbonInlineSep />
        <RibbonButton label="Excluir linha" onClick={() => chain().deleteRow().run()}>
          <span className="flex items-center gap-[1px]">
            <Rows3 size={15} />
            <Trash2 size={10} />
          </span>
        </RibbonButton>
        <RibbonButton label="Excluir coluna" onClick={() => chain().deleteColumn().run()}>
          <span className="flex items-center gap-[1px]">
            <Columns3 size={15} />
            <Trash2 size={10} />
          </span>
        </RibbonButton>
        <RibbonButton
          label="Distribuir colunas igualmente"
          onClick={() => chain().distributeTableColumns().run()}
        >
          <ChevronsLeftRight size={16} />
        </RibbonButton>
      </RibbonGroup>
      <RibbonSep />

      <RibbonGroup label="Tabela" gap={6}>
        <Popover
          align="end"
          panelClassName="w-56"
          trigger={(p) => (
            <RibbonSelectTrigger
              {...p}
              title="Largura da tabela"
              width={120}
              label={TABLE_WIDTHS.find((w) => w.value === s.width)?.label ?? "Coluna do texto"}
              style={MONO}
            />
          )}
        >
          {(close) => (
            <>
              <MenuLabel>Largura</MenuLabel>
              {TABLE_WIDTHS.map((w) => (
                <MenuItem
                  key={w.value}
                  active={w.value === s.width}
                  onClick={() => {
                    set({ width: w.value });
                    close();
                  }}
                >
                  {w.label}
                </MenuItem>
              ))}
              <MenuDivider />
              <MenuLabel>Na página</MenuLabel>
              {TABLE_ALIGNS.map((a) => (
                <MenuItem
                  key={a.value}
                  active={a.value === s.align}
                  onClick={() => {
                    set({ align: a.value });
                    close();
                  }}
                >
                  {a.label}
                </MenuItem>
              ))}
            </>
          )}
        </Popover>

        <button
          type="button"
          className="fx-act fx-act-danger"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => chain().deleteTable().run()}
        >
          <Trash2 size={14} />
          Excluir tabela
        </button>
      </RibbonGroup>
    </>
  );
}
