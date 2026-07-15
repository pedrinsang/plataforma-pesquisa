import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ email }: { email: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
      <Link href="/projects" className="font-semibold text-zinc-900 dark:text-zinc-50">
        Plataforma de Pesquisa
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">{email}</span>
        <ThemeToggle />
        <form action={signOut}>
          <Button type="submit" variant="ghost" className="text-sm">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
