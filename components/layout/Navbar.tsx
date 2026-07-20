import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { AppMark } from "./AppMark";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <Link href="/projects" className="flex items-center gap-2.5">
        <AppMark />
        <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.22em] text-foreground">
          Plataforma
          <span className="text-text-dim"> / Pesquisa</span>
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <div className="mx-1 hidden items-center gap-2 rounded-full border border-border-subtle bg-surface-dim py-1 pl-1 pr-3 sm:flex">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent-teal text-[0.7rem] font-semibold text-[#04211d]">
            {initial}
          </span>
          <span className="max-w-[14rem] truncate text-xs text-text-dim">{email}</span>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="rounded-lg p-2 text-text-dim transition-colors hover:bg-accent-gold-soft hover:text-accent-gold"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
