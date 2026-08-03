"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { DocumentTopBar } from "@/components/writing/DocumentTopBar";
import { RibbonTabs, type RibbonTab } from "@/components/writing/RibbonTabs";
import { Ribbon } from "@/components/writing/ribbon/Ribbon";
import { OutlinePanel } from "@/components/writing/OutlinePanel";
import {
  SideRail,
  type LeftPanel,
  type RailPanel,
  type RightPanel,
} from "@/components/writing/SideRail";
import { StatPanel } from "@/components/writing/StatPanel";
import { ReferencesPanel } from "@/components/writing/ReferencesPanel";
import { ArticleReader, type CiteRequest } from "@/components/writing/ArticleReader";
import { WritingCanvas } from "@/components/writing/WritingCanvas";
import { RulerBand } from "@/components/writing/WritingRuler";
import { WritingStatusBar } from "@/components/writing/WritingStatusBar";
import { SearchReplacePanel } from "@/components/writing/SearchReplacePanel";
import { buildEditorExtensions } from "@/lib/writing/editor-extensions";
import { ZOOM_DEFAULT } from "@/lib/writing/page-metrics";
import type { StatSourceKind } from "@/lib/writing/stat-sources";
import { getReference, type OpenArticle } from "@/lib/writing/reference-sources";
import { buildCitationInsert } from "@/lib/writing/quote";
import type { CitationStyle } from "@/lib/references/format";
import {
  updateDocumentContent,
  updateDocumentTitle,
  updateDocumentHeaderFooter,
  updateWordGoal,
  deleteDocument,
} from "@/lib/actions/documents";

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/** Largura inicial do leitor de artigos (px) — metade "de leitura" da tela. */
const READER_WIDTH_DEFAULT = 520;

/**
 * Editor de Escrita em tela cheia (design "Escrita — Editor em tela cheia"):
 * três linhas de chrome no topo (documento · abas da faixa · faixa agrupada),
 * régua, folha centralizada, **dois trilhos de painéis** (instrumentos à
 * direita, navegação do texto à esquerda) e barra de status. O shell é uma ilha
 * de tinta (`.folium-shell`) — escuro nos dois temas do app, com a folha branca
 * no centro.
 */
export function DocumentEditor({
  documentId,
  projectId,
  initialTitle,
  initialContent,
  initialWordGoal,
  initialHeader,
  initialFooter,
  userEmail,
}: {
  documentId: string;
  projectId: string;
  initialTitle: string;
  initialContent: object;
  initialWordGoal: number | null;
  initialHeader: string | null;
  initialFooter: string | null;
  userEmail: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [headerFooter, setHeaderFooter] = useState({
    header: initialHeader ?? "",
    footer: initialFooter ?? "",
  });
  const [goal, setGoal] = useState(initialWordGoal);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [tab, setTab] = useState<RibbonTab>("Início");
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  // Um painel por trilho: dá para consultar o sumário e a biblioteca ao mesmo
  // tempo, um de cada lado da folha.
  const [rightPanel, setRightPanel] = useState<RightPanel | null>(null);
  const [leftPanel, setLeftPanel] = useState<LeftPanel | null>(null);
  const [articles, setArticles] = useState<OpenArticle[]>([]);
  const [activeArticle, setActiveArticle] = useState<string | null>(null);
  const [readerWidth, setReaderWidth] = useState(READER_WIDTH_DEFAULT);
  // Norma do documento inteiro: as citações guardam o vínculo, não o texto, e
  // se reescrevem quando isto muda.
  const [citationStyle, setCitationStyle] = useState<CitationStyle>("abnt");
  const [linkOpenSignal, setLinkOpenSignal] = useState(0);
  const [search, setSearch] = useState<{ open: boolean; replace: boolean }>({
    open: false,
    replace: false,
  });
  const [showRuler, setShowRuler] = useState(true);
  const [viewport, setViewport] = useState({ scrollLeft: 0, gutter: 0 });

  const contentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerFooterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorUpdate = useCallback(
    (json: object, text: string) => {
      setWordCount(countWords(text));
      setCharCount(text.length);
      setSaveStatus("saving");
      if (contentTimer.current) clearTimeout(contentTimer.current);
      contentTimer.current = setTimeout(async () => {
        await updateDocumentContent(documentId, json);
        setSaveStatus("saved");
      }, 800);
    },
    [documentId],
  );

  const editor = useEditor({
    extensions: buildEditorExtensions({ projectId }),
    content: (initialContent as never) ?? null,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "folium-editor prose prose-zinc prose-lg prose-headings:font-serif prose-headings:font-semibold prose-p:leading-relaxed max-w-none focus:outline-none",
      },
    },
    onCreate: ({ editor }) => {
      const text = editor.getText();
      setWordCount(countWords(text));
      setCharCount(text.length);
    },
    onUpdate: ({ editor }) => handleEditorUpdate(editor.getJSON(), editor.getText()),
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  // O shell ocupa a viewport inteira: trava a rolagem da página por baixo.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Ctrl/Cmd+K abre o popover de link (padrão de processador de texto).
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setTab("Inserir");
        setLinkOpenSignal((n) => n + 1);
      }
    };
    dom.addEventListener("keydown", onKeyDown);
    return () => dom.removeEventListener("keydown", onKeyDown);
  }, [editor]);

  // Ctrl/Cmd+F (localizar) e Ctrl/Cmd+H (substituir) — nível de página, para
  // funcionar mesmo com o foco fora da folha.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === "f") {
        e.preventDefault();
        setSearch({ open: true, replace: false });
      } else if (key === "h") {
        e.preventDefault();
        setSearch({ open: true, replace: true });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSaveStatus("saving");
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(async () => {
      await updateDocumentTitle(documentId, projectId, value);
      setSaveStatus("saved");
    }, 800);
  }

  function handleHeaderFooterChange(next: { header: string; footer: string }) {
    setHeaderFooter(next);
    setSaveStatus("saving");
    if (headerFooterTimer.current) clearTimeout(headerFooterTimer.current);
    headerFooterTimer.current = setTimeout(async () => {
      await updateDocumentHeaderFooter(documentId, next.header, next.footer);
      setSaveStatus("saved");
    }, 800);
  }

  function handleGoalChange(next: number | null) {
    setGoal(next);
    void updateWordGoal(documentId, next);
  }

  function handleInsertStat(statId: string, kind: StatSourceKind) {
    editor?.chain().focus().insertStatChart({ statId, statType: kind }).run();
    setRightPanel(null);
  }

  /** Alterna o painel do trilho, mantendo os dois lados independentes. */
  function toggleRail(panel: RailPanel) {
    if (panel === "outline" || panel === "notes" || panel === "versions") {
      setLeftPanel((prev) => (prev === panel ? null : panel));
    } else {
      setRightPanel((prev) => (prev === panel ? null : panel));
    }
  }

  /**
   * Abrir um artigo da biblioteca não sai do editor: o item entra na lista do
   * painel "Artigos" (logo abaixo de Referências no trilho) e a página se divide
   * em duas — texto de um lado, artigo do outro.
   */
  function handleOpenArticle(article: OpenArticle) {
    setArticles((prev) => (prev.some((a) => a.id === article.id) ? prev : [...prev, article]));
    setActiveArticle(article.id);
    setRightPanel("articles");
  }

  function handleCloseArticle(id: string) {
    const next = articles.filter((a) => a.id !== id);
    setArticles(next);
    if (activeArticle === id) setActiveArticle(next.at(-1)?.id ?? null);
  }

  /**
   * Insere uma citação vinculada no ponto do cursor. Vem de dois lugares: do
   * botão "Citar" da biblioteca (citação indireta, sem trecho) e da bolha do
   * leitor de artigos (citação direta, com o trecho marcado e a página).
   * A forma — aspas no meio do parágrafo ou bloco recuado — sai da norma e do
   * tamanho do trecho, em `buildCitationInsert`.
   */
  async function handleCite({ referenceId, locator, excerpt }: CiteRequest) {
    if (!editor) return;
    const reference = await getReference(projectId, referenceId);
    if (!reference) return;
    const { content } = buildCitationInsert({
      reference,
      style: citationStyle,
      locator,
      excerpt,
    });
    editor.chain().focus().insertContent(content).run();
  }

  /** Trocar a norma reescreve todas as citações já postas no documento. */
  function handleCitationStyleChange(next: CitationStyle) {
    setCitationStyle(next);
    editor?.commands.setCitationStyle(next);
  }

  return (
    <div className="folium-shell fixed inset-0 z-50 flex flex-col">
      <DocumentTopBar
        projectId={projectId}
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler((v) => !v)}
        header={headerFooter.header}
        footer={headerFooter.footer}
        onHeaderFooterChange={handleHeaderFooterChange}
        userInitial={(userEmail.trim()[0] ?? "?").toUpperCase()}
        userEmail={userEmail}
      />

      <RibbonTabs
        active={tab}
        onSelect={(next) => {
          setTab(next);
          setRibbonCollapsed(false);
        }}
        collapsed={ribbonCollapsed}
        onToggleCollapsed={() => setRibbonCollapsed((v) => !v)}
      />

      {editor && !ribbonCollapsed && (
        <Ribbon
          editor={editor}
          tab={tab}
          projectId={projectId}
          linkOpenSignal={linkOpenSignal}
          onInsertStat={() => setRightPanel("stats")}
          onOpenReferences={() => setRightPanel("references")}
          onFind={() => setSearch({ open: true, replace: false })}
          onReplace={() => setSearch({ open: true, replace: true })}
          showRuler={showRuler}
          onToggleRuler={() => setShowRuler((v) => !v)}
          header={headerFooter.header}
          footer={headerFooter.footer}
          onHeaderFooterChange={handleHeaderFooterChange}
          onDelete={() => {
            if (confirm("Excluir este documento?")) deleteDocument(documentId, projectId);
          }}
          wordCount={wordCount}
          charCount={charCount}
          goal={goal}
          onGoalChange={handleGoalChange}
        />
      )}

      <div className="relative flex min-h-0 flex-1">
        <SideRail side="left" open={leftPanel} onToggle={toggleRail} />
        {leftPanel === "outline" && editor && (
          <OutlinePanel editor={editor} onClose={() => setLeftPanel(null)} />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          {showRuler && editor && (
            <RulerBand
              editor={editor}
              zoom={zoom}
              scrollLeft={viewport.scrollLeft}
              gutter={viewport.gutter}
            />
          )}
          <WritingCanvas
            editor={editor}
            zoom={zoom}
            header={headerFooter.header}
            footer={headerFooter.footer}
            onPageCountChange={setPageCount}
            onCurrentPageChange={setCurrentPage}
            onViewport={setViewport}
          />
        </div>

        {rightPanel === "stats" && (
          <StatPanel
            projectId={projectId}
            onClose={() => setRightPanel(null)}
            onInsert={handleInsertStat}
          />
        )}
        {rightPanel === "references" && (
          <ReferencesPanel
            projectId={projectId}
            onClose={() => setRightPanel(null)}
            onOpenArticle={handleOpenArticle}
            onCite={(referenceId) => void handleCite({ referenceId, locator: null, excerpt: null })}
            openArticleIds={articles.map((a) => a.id)}
            style={citationStyle}
            onStyleChange={handleCitationStyleChange}
          />
        )}
        {rightPanel === "articles" && (
          <ArticleReader
            articles={articles}
            activeId={activeArticle}
            width={readerWidth}
            onWidthChange={setReaderWidth}
            onSelect={setActiveArticle}
            onCloseArticle={handleCloseArticle}
            onClose={() => setRightPanel(null)}
            onOpenLibrary={() => setRightPanel("references")}
            onCite={(request) => void handleCite(request)}
          />
        )}

        <SideRail
          side="right"
          open={rightPanel}
          onToggle={toggleRail}
          articleCount={articles.length}
        />

        {editor && (
          <SearchReplacePanel
            editor={editor}
            open={search.open}
            showReplace={search.replace}
            onClose={() => setSearch({ open: false, replace: false })}
          />
        )}
      </div>

      <WritingStatusBar
        currentPage={currentPage}
        pageCount={pageCount}
        wordCount={wordCount}
        charCount={charCount}
        goal={goal}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    </div>
  );
}
