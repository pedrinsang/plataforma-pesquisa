import Link from "next/link";
import { Search, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { AppMark } from "./AppMark";
import { ThemeToggle } from "./ThemeToggle";

// Barra superior da área logada: busca (decorativa nesta fase), tema e conta.
// No mobile a sidebar some, então a topbar carrega a marca e o sair.
export function Topbar({ email }: { email: string }) {
  const initials = (email.trim()[0] ?? "?").toUpperCase();

  return (
    <header className="flex items-center gap-3 border-b border-border-subtle bg-surface px-4 py-3 sm:px-6">
      {/* marca — só no mobile (no desktop ela vive na sidebar) */}
      <Link href="/projects" className="flex items-center gap-2 md:hidden">
        <AppMark size={24} />
        <span className="font-serif text-lg font-semibold text-foreground">Compasso</span>
      </Link>

      {/* busca */}
      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search
          size={16}
          strokeWidth={1.7}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
        />
        <input
          className="input !bg-bg !pl-9"
          placeholder="Buscar projetos, referências, amostras…"
          aria-label="Buscar"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <span
          className="hidden size-9 items-center justify-center rounded-full font-serif text-[13px] font-semibold sm:flex"
          style={{ background: "var(--color-accent-200)", color: "var(--color-accent-800)" }}
          title={email}
        >
          {initials}
        </span>
        <form action={signOut} className="md:hidden">
          <button type="submit" aria-label="Sair" title="Sair" className="ib !size-9">
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  );
}
