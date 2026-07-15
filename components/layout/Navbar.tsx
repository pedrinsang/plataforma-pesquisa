import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ email }: { email: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4">
      <Link href="/projects" className="font-serif text-lg font-semibold text-foreground">
        Plataforma de Pesquisa
      </Link>
      <div className="flex items-center gap-1">
        <span className="hidden pr-2 text-sm text-zinc-500 sm:inline dark:text-zinc-400">{email}</span>
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            title="Sair"
            aria-label="Sair"
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            <LogOut size={18} />
          </button>
        </form>
      </div>
    </header>
  );
}
