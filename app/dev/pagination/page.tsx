import { notFound } from "next/navigation";
import { PaginationLab } from "./PaginationLab";

/**
 * Banco de ensaio da paginação — só em desenvolvimento.
 *
 * A rota é pública de propósito (ver `proxy.ts`): ela não lê nada do usuário,
 * monta um documento fixo em memória e serve para reproduzir defeitos de
 * medição da folha. Em produção não existe.
 */
export const dynamic = "force-static";

export default function DevPaginationPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PaginationLab />;
}
