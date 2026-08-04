"use client";

import { useRef, useState, useTransition } from "react";
import { FileText, Link2, Loader2, PenLine, Sparkle, Upload, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { ReferenceType } from "@/lib/types/database";
import { createReference, importReferenceMetadata, updateReference } from "@/lib/actions/references";
import { formatReference } from "@/lib/references/format";
import { scanPdfMetadata } from "@/lib/references/pdf-meta";
import { REFERENCE_ACCEPT, formatFileSize } from "@/lib/references/storage";
import { removeReferenceFile, uploadReferenceFile } from "@/lib/references/upload";
import {
  REFERENCE_TYPE_LABEL,
  REFERENCE_TYPE_ORDER,
  draftToPreviewRow,
  emptyDraft,
  rowToDraft,
  type ReferenceDraft,
  type ReferenceRow,
} from "@/lib/references/types";

type Mode = "link" | "file" | "manual";

export function ReferenceModal({
  projectId,
  initial,
  onClose,
}: {
  projectId: string;
  initial: ReferenceRow | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ReferenceDraft>(() =>
    initial ? rowToDraft(initial) : emptyDraft(),
  );
  const [tagsText, setTagsText] = useState(() => (initial?.tags ?? []).join(", "));
  const [mode, setMode] = useState<Mode>(initial ? "manual" : "link");
  const [lookupInput, setLookupInput] = useState("");
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ReferenceDraft[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof ReferenceDraft>(key: K, value: ReferenceDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  // Mantém o que o usuário já digitou: o import só preenche o que veio da API.
  function applyDraft(incoming: ReferenceDraft) {
    setDraft((prev) => ({
      ...incoming,
      isEssential: prev.isEssential,
      notes: prev.notes,
      tags: prev.tags,
      filePath: prev.filePath,
      fileName: prev.fileName,
      fileSize: prev.fileSize,
      fileMime: prev.fileMime,
    }));
    setSuggestions([]);
  }

  async function runLookup(input: string) {
    if (!input.trim()) return;
    setImporting(true);
    setImportNote(null);
    setError(null);
    setSuggestions([]);
    try {
      const result = await importReferenceMetadata(input);
      if (result.ok) {
        applyDraft(result.draft);
        setImportNote("Dados encontrados — confira antes de salvar.");
        setMode("manual");
      } else {
        setSuggestions(result.suggestions ?? []);
        setImportNote(result.error);
        if (!result.suggestions?.length) {
          // O link em si já é informação útil; guarda para o usuário completar.
          if (/^https?:\/\//i.test(input.trim())) set("url", input.trim());
          setMode("manual");
        }
      }
    } catch {
      setImportNote("Falha ao buscar os dados. Preencha os campos à mão.");
    } finally {
      setImporting(false);
    }
  }

  async function onPickFile(picked: File | null) {
    setFile(picked);
    setError(null);
    if (!picked) return;

    setImporting(true);
    setImportNote(null);
    try {
      const meta = await scanPdfMetadata(picked);
      if (meta.doi) {
        const result = await importReferenceMetadata(meta.doi);
        if (result.ok) {
          applyDraft(result.draft);
          setImportNote("DOI encontrado dentro do PDF — dados preenchidos pelo Crossref.");
          setMode("manual");
          return;
        }
      }
      if (meta.title || meta.authors) {
        setDraft((prev) => ({
          ...prev,
          title: prev.title || meta.title || "",
          authors: prev.authors ?? meta.authors,
          year: prev.year ?? meta.year,
          containerTitle: prev.containerTitle ?? meta.containerTitle,
        }));
        setImportNote(
          "Li os metadados do PDF. Se estiverem incompletos, busque pelo título no campo acima.",
        );
      } else {
        setImportNote(
          "Esse PDF não traz metadados. Cole o DOI/link ou busque pelo título para preencher.",
        );
      }
      setMode("manual");
    } catch {
      setImportNote("Não consegui ler os metadados do arquivo — preencha os campos à mão.");
      setMode("manual");
    } finally {
      setImporting(false);
    }
  }

  function submit() {
    if (!draft.title.trim()) {
      setError("Informe o título da referência.");
      return;
    }
    setError(null);

    startTransition(async () => {
      let payload: ReferenceDraft = {
        ...draft,
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      const previousPath = initial?.file_path ?? null;

      if (file) {
        try {
          const uploaded = await uploadReferenceFile(file, projectId);
          payload = {
            ...payload,
            filePath: uploaded.path,
            fileName: uploaded.name,
            fileSize: uploaded.size,
            fileMime: uploaded.mime,
          };
        } catch (err) {
          setError(err instanceof Error ? err.message : "Falha ao enviar o arquivo.");
          return;
        }
      }

      const result = initial
        ? await updateReference(initial.id, projectId, payload)
        : await createReference(projectId, payload);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Substituiu o arquivo: o antigo não serve mais a ninguém.
      if (file && previousPath && previousPath !== payload.filePath) {
        await removeReferenceFile(previousPath);
      }
      onClose();
    });
  }

  const busy = pending || importing;
  const preview = draft.title.trim() ? formatReference(draftToPreviewRow(draft), "abnt") : null;

  return (
    <Modal
      open
      onClose={onClose}
      kicker="Referência"
      title={initial ? "Editar referência" : "Nova referência"}
    >
      <div className="flex flex-col gap-4">
        {!initial && (
          <div className="seg self-start" role="group" aria-label="Como adicionar">
            <button
              type="button"
              className="seg-opt !text-[12.5px]"
              data-active={mode === "link"}
              onClick={() => setMode("link")}
            >
              <Link2 size={13} /> Link ou DOI
            </button>
            <button
              type="button"
              className="seg-opt !text-[12.5px]"
              data-active={mode === "file"}
              onClick={() => setMode("file")}
            >
              <Upload size={13} /> Arquivo
            </button>
            <button
              type="button"
              className="seg-opt !text-[12.5px]"
              data-active={mode === "manual"}
              onClick={() => setMode("manual")}
            >
              <PenLine size={13} /> Manual
            </button>
          </div>
        )}

        {mode === "link" && !initial && (
          <div className="rounded-lg border border-border-subtle bg-bg p-4">
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">
                Cole o link do artigo, o DOI, o PMID, o ISBN — ou o título do trabalho
              </span>
              <div className="flex gap-2">
                <input
                  className="input !py-1.5 !text-[14px]"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runLookup(lookupInput);
                    }
                  }}
                  placeholder="https://doi.org/10.1016/… · 10.1016/j.cell.2024.01.001 · Efeito de…"
                  autoFocus
                  disabled={busy}
                />
                <button
                  type="button"
                  className="btn btn-primary shrink-0 !py-1.5 !text-[13px]"
                  onClick={() => void runLookup(lookupInput)}
                  disabled={busy || !lookupInput.trim()}
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Sparkle size={14} />}
                  {importing ? "Buscando…" : "Buscar dados"}
                </button>
              </div>
            </label>
            <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
              Os dados vêm do Crossref, PubMed, arXiv, OpenLibrary ou das meta tags da página —
              serviços públicos e gratuitos, sem IA.
            </p>
          </div>
        )}

        {mode === "file" && !initial && (
          <div className="rounded-lg border border-border-subtle bg-bg p-4">
            <span className="mb-2 block text-[11.5px] text-text-dim">
              Envie o PDF do artigo (também aceita DOC/DOCX, RTF, EPUB, TXT e imagem)
            </span>
            <button
              type="button"
              className="btn btn-secondary !py-1.5 !text-[13px]"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {file ? "Trocar arquivo" : "Escolher arquivo"}
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
              Se o PDF trouxer o DOI nos metadados (o caso da maioria das revistas), os campos são
              preenchidos sozinhos. O arquivo só é enviado quando você salvar.
            </p>
          </div>
        )}

        {importNote && (
          <p className="text-[12px] text-accent-teal">{importNote}</p>
        )}

        {suggestions.length > 0 && (
          <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
            {suggestions.map((s, i) => (
              <li key={`${s.doi ?? s.title}-${i}`}>
                <button
                  type="button"
                  className="w-full px-3.5 py-2.5 text-left transition-colors hover:bg-accent-100/40"
                  onClick={() => {
                    applyDraft(s);
                    setImportNote("Referência escolhida — confira os campos.");
                    setMode("manual");
                  }}
                >
                  <span className="block text-[13.5px] font-medium text-foreground">{s.title}</span>
                  <span className="mt-0.5 block text-[11.5px] text-text-dim">
                    {[s.authors, s.containerTitle, s.year].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ── formulário ── */}
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[11.5px] text-text-dim">Título *</span>
            <textarea
              className="input !min-h-16 !py-1.5 !text-[14px]"
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Título do artigo, livro ou página"
              disabled={busy}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">
              Autores <span className="text-[10.5px]">(separados por ponto e vírgula)</span>
            </span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.authors ?? ""}
              onChange={(e) => set("authors", e.target.value || null)}
              placeholder="Silva, João A.; Souza, Maria"
              disabled={busy}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Tipo</span>
            <select
              className="input !py-1.5 !text-[14px]"
              value={draft.refType}
              onChange={(e) => set("refType", e.target.value as ReferenceType)}
              disabled={busy}
            >
              {REFERENCE_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {REFERENCE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">
              Revista, livro ou site
            </span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.containerTitle ?? ""}
              onChange={(e) => set("containerTitle", e.target.value || null)}
              disabled={busy}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Ano</span>
            <input
              className="input !py-1.5 !text-[14px] tabular-nums"
              value={draft.year ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, "").slice(0, 4));
                set("year", n > 0 ? n : null);
              }}
              inputMode="numeric"
              placeholder="2024"
              disabled={busy}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Volume</span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.volume ?? ""}
              onChange={(e) => set("volume", e.target.value || null)}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Número</span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.issue ?? ""}
              onChange={(e) => set("issue", e.target.value || null)}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Páginas</span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.pages ?? ""}
              onChange={(e) => set("pages", e.target.value || null)}
              placeholder="120-135"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Editora</span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.publisher ?? ""}
              onChange={(e) => set("publisher", e.target.value || null)}
              disabled={busy}
            />
          </label>
        </div>

        {/* Elementos que a ABNT NBR 6023:2018 exige e que as APIs bibliográficas
            raramente trazem. O local é **essencial** em livro, tese e evento —
            sem ele a referência sai como "[S. l.]". Os campos aparecem conforme
            o tipo, senão o formulário viraria uma parede de caixas vazias. */}
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Local</span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={draft.place ?? ""}
              onChange={(e) => set("place", e.target.value || null)}
              placeholder="São Paulo"
              disabled={busy}
            />
          </label>

          {(draft.refType === "book" ||
            draft.refType === "chapter" ||
            draft.refType === "report") && (
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Edição</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.edition ?? ""}
                onChange={(e) => set("edition", e.target.value || null)}
                placeholder="4. ed."
                disabled={busy}
              />
            </label>
          )}

          {(draft.refType === "article" || draft.refType === "preprint") && (
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Mês / período</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.issuedMonth ?? ""}
                onChange={(e) => set("issuedMonth", e.target.value || null)}
                placeholder="jul./dez."
                disabled={busy}
              />
            </label>
          )}

          {draft.refType === "conference" && (
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Nº do evento</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.eventNumber ?? ""}
                onChange={(e) => set("eventNumber", e.target.value || null)}
                placeholder="6"
                disabled={busy}
              />
            </label>
          )}

          {/* Só quando não há ano certo: a 6023 pede uma aproximação entre
              colchetes, e não admite "[s.d.]". */}
          {draft.year === null && (
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Ano aproximado</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.yearText ?? ""}
                onChange={(e) => set("yearText", e.target.value || null)}
                placeholder="2010? · ca. 2005 · 200-"
                disabled={busy}
              />
            </label>
          )}
        </div>

        {draft.refType === "thesis" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Grau</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.degree ?? ""}
                onChange={(e) => set("degree", e.target.value || null)}
                placeholder="Doutorado · Mestrado"
                disabled={busy}
                list="folium-degrees"
              />
              <datalist id="folium-degrees">
                <option value="Doutorado" />
                <option value="Mestrado" />
                <option value="Especialização" />
                <option value="Graduação" />
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Curso</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.program ?? ""}
                onChange={(e) => set("program", e.target.value || null)}
                placeholder="Economia"
                disabled={busy}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11.5px] text-text-dim">Instituição</span>
              <input
                className="input !py-1.5 !text-[14px]"
                value={draft.institution ?? ""}
                onChange={(e) => set("institution", e.target.value || null)}
                placeholder="Universidade Federal do Ceará"
                disabled={busy}
              />
            </label>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">DOI</span>
            <input
              className="input !py-1.5 font-mono !text-[13px]"
              value={draft.doi ?? ""}
              onChange={(e) => set("doi", e.target.value || null)}
              placeholder="10.1016/j.cell.2024.01.001"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">Link</span>
            <input
              className="input !py-1.5 !text-[13px]"
              value={draft.url ?? ""}
              onChange={(e) => set("url", e.target.value || null)}
              placeholder="https://…"
              disabled={busy}
            />
          </label>
        </div>

        {/* arquivo */}
        <div className="rounded-lg border border-border-subtle px-3.5 py-3">
          <span className="mb-1.5 block text-[11.5px] text-text-dim">Arquivo</span>
          {file ? (
            <div className="flex items-center gap-2 text-[13px] text-foreground">
              <FileText size={14} className="text-accent-teal" />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-[11.5px] text-text-dim">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="ib !size-6 !border-0 text-text-dim hover:text-neg"
                aria-label="Remover arquivo escolhido"
                disabled={busy}
              >
                <X size={12} />
              </button>
            </div>
          ) : draft.filePath ? (
            <div className="flex items-center gap-2 text-[13px] text-foreground">
              <FileText size={14} className="text-accent-teal" />
              <span className="min-w-0 flex-1 truncate">{draft.fileName ?? "Arquivo anexado"}</span>
              <span className="shrink-0 text-[11.5px] text-text-dim">
                {formatFileSize(draft.fileSize)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    filePath: null,
                    fileName: null,
                    fileSize: null,
                    fileMime: null,
                  }))
                }
                className="ib !size-6 !border-0 text-text-dim hover:text-neg"
                aria-label="Desanexar arquivo"
                disabled={busy}
              >
                <X size={12} />
              </button>
            </div>
          ) : null}
          {/* O input fica sempre montado (só escondido) porque o botão do modo
              "Arquivo" dispara o clique nele por referência. */}
          <input
            ref={fileInputRef}
            type="file"
            accept={REFERENCE_ACCEPT}
            className={
              file || draft.filePath
                ? "hidden"
                : "input !py-1.5 !text-[13px] file:mr-3 file:rounded file:border-0 file:bg-accent-100 file:px-2 file:py-1 file:text-[12px] file:text-accent-800"
            }
            onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11.5px] text-text-dim">
              Tags <span className="text-[10.5px]">(separadas por vírgula)</span>
            </span>
            <input
              className="input !py-1.5 !text-[14px]"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="metodologia, revisão"
              disabled={busy}
            />
          </label>
          <label className="flex items-end gap-2 pb-1.5">
            <input
              type="checkbox"
              checked={draft.isEssential}
              onChange={(e) => set("isEssential", e.target.checked)}
              disabled={busy}
              className="size-4 accent-[var(--color-accent)]"
            />
            <span className="text-[13px] text-foreground">Marcar como leitura essencial</span>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11.5px] text-text-dim">Notas do projeto</span>
          <textarea
            className="input !min-h-16 !py-1.5 !text-[14px]"
            value={draft.notes ?? ""}
            onChange={(e) => set("notes", e.target.value || null)}
            placeholder="Por que essa fonte importa para o projeto, trechos a citar…"
            disabled={busy}
          />
        </label>

        {preview && (
          <div className="rounded-lg border border-dashed border-border-subtle px-3.5 py-3">
            <p className="mb-1 text-[0.62rem] uppercase tracking-[0.14em] text-accent-teal">
              Prévia (ABNT)
            </p>
            <p className="text-[12.5px] leading-relaxed text-text-dim">{preview}</p>
          </div>
        )}

        {error && <p className="text-[12px] text-neg">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            className="btn btn-ghost !text-[13px]"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary !text-[13px]"
            onClick={submit}
            disabled={busy}
          >
            {pending ? "Salvando…" : initial ? "Salvar referência" : "Adicionar referência"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
