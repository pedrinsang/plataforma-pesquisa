"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string | null };

// O destino vem de um campo do formulário: só aceitamos caminho interno
// ("/algo"), nunca "//host" nem URL absoluta — senão o login vira um
// redirecionamento aberto para fora da plataforma.
function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? "");
  return /^\/(?!\/)/.test(next) ? next : "/projects";
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();

  const { data: rateLimit } = await supabase
    .rpc("check_login_rate_limit", { p_email: email })
    .single<{ allowed: boolean; retry_after_seconds: number }>();

  if (rateLimit && !rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retry_after_seconds / 60);
    return { error: `Muitas tentativas. Tente novamente em ${minutes} min.` };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await supabase.rpc("register_login_failure", { p_email: email });
    return { error: "E-mail ou senha inválidos." };
  }

  await supabase.rpc("register_login_success", { p_email: email });
  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Se a confirmação de e-mail estiver desativada no projeto Supabase,
  // signUp já devolve uma sessão ativa — não faz sentido mandar pro login.
  if (data.session) {
    redirect(next);
  }

  redirect(`/login?cadastro=confirme-seu-email&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
