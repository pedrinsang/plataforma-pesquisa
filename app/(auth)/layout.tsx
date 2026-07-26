import { ThemeToggle } from "@/components/layout/ThemeToggle";

// As telas de auth (login/signup) não têm sidebar/topbar, então o alternador de
// tema mora aqui, fixo no canto — presente em todas as páginas do grupo.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
