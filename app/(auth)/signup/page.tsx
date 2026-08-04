import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AppMark } from "@/components/layout/AppMark";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && /^\/(?!\/)/.test(next) ? next : undefined;

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <AppMark size={30} />
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Folium
          </span>
        </Link>
        <p className="text-center text-[0.72rem] uppercase tracking-[0.16em] text-accent-teal">
          Comece de graça
        </p>
        <h1 className="mb-6 mt-2 text-center font-serif text-3xl font-semibold text-foreground">
          Criar conta
        </h1>
        <Card>
          <SignupForm next={safeNext} />
        </Card>
      </div>
    </div>
  );
}
