"use client";

import Link from "next/link";
import { ArrowLeft, Download, Printer, Rows3, Ruler, Share2 } from "lucide-react";
import { HeaderFooterControl } from "./HeaderFooterControl";
import { cn } from "@/lib/utils/cn";

/**
 * Primeira linha do chrome: voltar, título editável, estado de salvamento e as
 * ações do documento (régua, cabeçalho/rodapé, imprimir, PDF, compartilhar).
 */
export function DocumentTopBar({
  projectId,
  title,
  onTitleChange,
  saveStatus,
  showRuler,
  onToggleRuler,
  header,
  footer,
  onHeaderFooterChange,
  userInitial,
  userEmail,
}: {
  projectId: string;
  title: string;
  onTitleChange: (value: string) => void;
  saveStatus: "saved" | "saving";
  showRuler: boolean;
  onToggleRuler: () => void;
  header: string;
  footer: string;
  onHeaderFooterChange: (next: { header: string; footer: string }) => void;
  userInitial: string;
  userEmail: string;
}) {
  const saving = saveStatus === "saving";

  return (
    <div className="fx-row fx-topbar print:hidden">
      <Link
        href={`/projects/${projectId}/writing`}
        className="fx-sq"
        title="Voltar para Documentos"
        aria-label="Voltar para Documentos"
      >
        <ArrowLeft size={16} />
      </Link>

      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Documento sem título"
        aria-label="Título do documento"
        className="fx-doc-title flex-1"
      />

      <span
        className="fx-mono flex items-center gap-1.5"
        style={{ color: saving ? "var(--fx-gold)" : "var(--fx-dim)" }}
      >
        <span
          className={cn("size-1.5 rounded-full", saving && "animate-pulse")}
          style={{ background: saving ? "var(--fx-gold)" : "var(--fx-teal)" }}
        />
        {saving ? "Salvando" : "Salvo"}
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          className="fx-sq"
          onClick={onToggleRuler}
          aria-pressed={showRuler}
          title={showRuler ? "Ocultar régua" : "Mostrar régua"}
          aria-label="Régua"
        >
          <Ruler size={15} />
        </button>

        <HeaderFooterControl
          header={header}
          footer={footer}
          onChange={onHeaderFooterChange}
          icon={<Rows3 size={15} />}
          className="fx-sq"
        />

        <span className="fx-vline" aria-hidden />

        <button type="button" className="fx-act" onClick={() => window.print()} title="Imprimir">
          <Printer size={14} />
          Imprimir
        </button>
        <button
          type="button"
          className="fx-act fx-act-gold"
          onClick={() => window.print()}
          title="Baixar PDF — abre a impressão do navegador; escolha “Salvar como PDF”"
        >
          <Download size={14} />
          Baixar PDF
        </button>
        <Link
          href={`/projects/${projectId}/settings`}
          className="fx-act fx-act-teal"
          title="Compartilhar — participantes do projeto"
        >
          <Share2 size={14} />
          Compartilhar
        </Link>

        <span className="fx-avatar" title={userEmail}>
          {userInitial}
        </span>
      </div>
    </div>
  );
}
