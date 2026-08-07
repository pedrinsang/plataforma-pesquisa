"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { WritingCanvas, type PaginationDiagnostics } from "@/components/writing/WritingCanvas";
import { buildEditorExtensions } from "@/lib/writing/editor-extensions";
import {
  ABNT_MARGINS,
  DEFAULT_MARGINS,
  ZOOM_DEFAULT,
  type PageMargins,
} from "@/lib/writing/page-metrics";
import { FIXTURES, fixtureById, type FixtureId } from "@/lib/writing/dev-fixtures";

/**
 * Banco de ensaio da paginação. Monta o mesmo `WritingCanvas` do editor de
 * verdade sobre um documento fixo, sem projeto e sem sessão, e mostra ao lado o
 * rastro da medição.
 *
 * O que ele existe para tornar visível: a medição pode entrar em **ciclo**
 * (aplicar o plano A muda a geometria de um jeito que faz medir B, e B de volta
 * a A). Na tela isso aparece só como a página "piscando" — aqui aparece como
 * número: passadas > 1 a cada tecla, e o aviso de ciclo aceso.
 */
export function PaginationLab() {
  const [fixture, setFixture] = useState<FixtureId>("viuva");
  const [margins, setMargins] = useState<PageMargins>(DEFAULT_MARGINS);
  const [widowControl, setWidowControl] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pageCount, setPageCount] = useState(1);
  const [diag, setDiag] = useState<PaginationDiagnostics | null>(null);
  // Histórico das últimas medições: é onde um ciclo fica óbvio (as passadas
  // sobem a cada tecla em vez de assentar em 1).
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<string[]>([]);

  const content = useMemo(() => fixtureById(fixture).content, [fixture]);

  const editor = useEditor(
    {
      extensions: buildEditorExtensions(),
      content: content as never,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            "folium-editor prose prose-zinc prose-lg prose-headings:font-semibold prose-p:leading-relaxed max-w-none focus:outline-none",
        },
      },
    },
    [content],
  );

  // O editor no `window` para inspeção pelo console (e pelas ferramentas de
  // automação): medir a altura do caret exige `view.coordsAtPos`, que é o mesmo
  // caminho que o ProseMirror usa para desenhá-lo. Só existe nesta rota.
  useEffect(() => {
    (window as unknown as { __foliumEditor?: unknown }).__foliumEditor = editor;
  }, [editor]);

  const handleDiagnostics = useCallback((d: PaginationDiagnostics) => {
    setDiag(d);
    const line =
      `p=${d.passes} ${d.cycle ? "CICLO" : d.exhausted ? "ESGOTOU" : "ok"} ` +
      `pág=${d.pageCount} vãos=${d.spacers.length}`;
    logRef.current = [line, ...logRef.current].slice(0, 14);
    setLog(logRef.current);
  }, []);

  /**
   * Trocar de fixture, de margem ou de zoom é outra geometria: o histórico da
   * anterior só confundiria a leitura. O reset vive nos próprios controles (e
   * não num efeito) porque é consequência do gesto, não do estado.
   */
  const resetLog = useCallback(() => {
    logRef.current = [];
    setLog([]);
  }, []);

  const worst = diag?.cycle || diag?.exhausted;

  return (
    <div className="folium-shell fixed inset-0 z-50 flex flex-col">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-2 text-[13px]">
        <strong className="font-semibold tracking-wide">Ensaio de paginação</strong>

        <select
          className="rounded border border-white/20 bg-transparent px-2 py-1"
          value={fixture}
          onChange={(e) => {
            resetLog();
            setFixture(e.target.value as FixtureId);
          }}
        >
          {FIXTURES.map((f) => (
            <option key={f.id} value={f.id} className="text-black">
              {f.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="rounded border border-white/20 px-2 py-1"
          onClick={() => {
            resetLog();
            setMargins((m) => (m === ABNT_MARGINS ? DEFAULT_MARGINS : ABNT_MARGINS));
          }}
        >
          {margins === ABNT_MARGINS ? "Margens: ABNT" : "Margens: padrão"}
        </button>

        <label className="flex items-center gap-1" title="Duas linhas do mesmo parágrafo de cada lado da virada">
          <input
            type="checkbox"
            checked={widowControl}
            data-testid="widow-control"
            onChange={(e) => {
              resetLog();
              setWidowControl(e.target.checked);
            }}
          />
          viúva/órfã
        </label>

        <label className="flex items-center gap-1">
          zoom
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={zoom}
            onChange={(e) => {
              resetLog();
              setZoom(Number(e.target.value));
            }}
          />
          <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        </label>

        <span className="ml-auto opacity-70">{fixtureById(fixture).hint}</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <WritingCanvas
            editor={editor}
            zoom={zoom}
            margins={margins}
            widowControl={widowControl}
            onPageCountChange={setPageCount}
            onDiagnostics={handleDiagnostics}
          />
        </div>

        <aside
          className="w-64 shrink-0 overflow-auto border-l border-white/10 p-3 font-mono text-[12px]"
          data-testid="pagination-diagnostics"
        >
          <div className={worst ? "text-red-400" : "text-emerald-400"}>
            {diag?.cycle
              ? "CICLO detectado"
              : diag?.exhausted
                ? "orçamento esgotado"
                : "convergiu"}
          </div>
          <dl className="mt-2 space-y-1">
            <div>
              passadas: <b data-testid="passes">{diag?.passes ?? "—"}</b>
            </div>
            <div>
              páginas: <b data-testid="page-count">{pageCount}</b>
            </div>
            <div>
              espaçadores: <b data-testid="spacers">{diag?.spacers.length ?? 0}</b>
            </div>
          </dl>

          <div className="mt-3 opacity-70">plano</div>
          <ul className="mt-1 space-y-0.5">
            {diag?.spacers.map((s, i) => (
              <li key={i}>
                {s.inline ? "linha" : "bloco"} @{s.pos} · {Math.round(s.height)}px
              </li>
            ))}
          </ul>

          <div className="mt-3 opacity-70">últimas medições</div>
          <ul className="mt-1 space-y-0.5">
            {log.map((line, i) => (
              <li key={i} className={line.includes("CICLO") ? "text-red-400" : undefined}>
                {line}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
