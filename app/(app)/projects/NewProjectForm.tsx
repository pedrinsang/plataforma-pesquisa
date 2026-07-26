"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { createProject, type ProjectActionState } from "@/lib/actions/projects";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";

const initialState: ProjectActionState = { error: null };

export function NewProjectForm({ variant = "button" }: { variant?: "button" | "tile" }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createProject, initialState);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {variant === "tile" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mcard flex min-h-[188px] flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-dashed border-accent-teal/40 p-5 text-center transition-colors hover:border-accent-teal hover:bg-accent-teal-soft/40"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-accent-teal-soft text-accent-teal">
            <Plus size={22} strokeWidth={1.6} />
          </span>
          <span>
            <span className="block font-serif text-[17px] font-semibold text-accent-teal">
              Criar projeto
            </span>
            <span className="mt-0.5 block text-[11.5px] text-text-dim">
              reúna escrita, referências e dados
            </span>
          </span>
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Novo projeto
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-neutral-900)_50%,transparent)] backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-6 shadow-lift">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.14em] text-accent-teal">Novo</p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  Projeto de pesquisa
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="ib !size-8 !border-0 text-text-dim"
              >
                <X size={18} />
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              <div className="field">
                <Label htmlFor="title">Título da pesquisa</Label>
                <Input id="title" name="title" required autoFocus placeholder="Ex: Efeito de X sobre Y" />
              </div>
              <div className="field">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Objetivo, área ou tema em uma frase."
                />
              </div>
              <FormMessage error={state.error ?? undefined} />
              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Criando..." : "Criar projeto"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
