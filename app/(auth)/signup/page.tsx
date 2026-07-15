import { Card } from "@/components/ui/Card";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Criar conta
        </h1>
        <Card>
          <SignupForm />
        </Card>
      </div>
    </div>
  );
}
