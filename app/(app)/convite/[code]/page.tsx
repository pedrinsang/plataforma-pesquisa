import Link from "next/link";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { formatInviteCode, normalizeInviteCode } from "@/lib/invites/format";
import { RedeemInviteForm } from "./RedeemInviteForm";

const ROLE_LABELS: Record<string, string> = {
  owner: "dono",
  editor: "editor",
  viewer: "leitor",
};

type Preview = {
  status: string;
  project_id: string | null;
  project_title: string | null;
  role: string | null;
  invited_email: string | null;
  inviter_name: string | null;
};

const PROBLEMS: Record<string, string> = {
  not_found: "Este convite não existe. Confira o link ou peça um novo à equipe do projeto.",
  revoked: "Este convite foi cancelado por quem o criou.",
  expired: "Este convite expirou. Peça um novo à equipe do projeto.",
  exhausted: "Este convite já atingiu o limite de usos.",
  wrong_email:
    "Este convite foi enviado para outro e-mail. Entre com a conta que recebeu o convite.",
  rpc_error:
    "Não foi possível consultar este convite agora. Tente novamente em instantes — o link continua válido.",
};

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("preview_project_invite", {
    p_code: normalizeInviteCode(decodeURIComponent(code)),
  });

  // Falha da RPC não é o mesmo que convite inexistente: tratar as duas como
  // "não existe" mandava o convidado embora dizendo uma inverdade, e escondia
  // o defeito. O motivo vai para o log do servidor e a tela pede para tentar
  // de novo, sem culpar o link.
  if (error) {
    console.error(`[convite] preview_project_invite falhou: ${error.message}`);
  }

  const invite = (data as Preview[] | null)?.[0];
  const status = error ? "rpc_error" : (invite?.status ?? "not_found");
  const problem = PROBLEMS[status];

  return (
    <div className="mx-auto max-w-lg py-6">
      <p className="text-center text-[0.7rem] uppercase tracking-[0.16em] text-accent-teal">
        Convite de participação
      </p>
      <h1 className="mb-6 mt-2 text-center font-serif text-3xl font-semibold text-foreground">
        {invite?.project_title ?? "Convite"}
      </h1>

      <Card className="space-y-4">
        <div className="flex items-center gap-2 text-text-dim">
          <KeyRound size={15} />
          <span className="font-mono text-[13px] tracking-[0.14em]">
            {formatInviteCode(decodeURIComponent(code))}
          </span>
        </div>

        {status === "valid" && invite?.role && (
          <>
            <p className="text-[14px] leading-relaxed text-foreground">
              {invite.inviter_name ? (
                <>
                  <span className="font-semibold">{invite.inviter_name}</span> convidou você
                </>
              ) : (
                "Você foi convidado(a)"
              )}{" "}
              para participar deste projeto como{" "}
              <span className="text-accent-teal">{ROLE_LABELS[invite.role] ?? invite.role}</span>.
            </p>
            <RedeemInviteForm code={normalizeInviteCode(decodeURIComponent(code))} />
          </>
        )}

        {status === "already_member" && invite?.project_id && (
          <div className="space-y-3">
            <p className="text-[14px] text-foreground">Você já participa deste projeto.</p>
            <Link href={`/projects/${invite.project_id}`} className="btn btn-primary">
              Abrir projeto
            </Link>
          </div>
        )}

        {problem && (
          <div className="space-y-3">
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--color-neg)" }}>
              {problem}
            </p>
            <Link href="/projects" className="btn btn-secondary">
              Voltar aos meus projetos
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
