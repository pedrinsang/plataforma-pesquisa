import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  role: z.enum(["owner", "editor", "viewer"]),
});

// Convite por código: sem e-mail, com validade e limite de usos opcionais.
// Campos vazios do formulário viram `null` (= sem validade / sem limite).
const optionalCount = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (raw === "" || raw === "0") return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
  });

export const inviteCodeSchema = z.object({
  role: z.enum(["owner", "editor", "viewer"]),
  expiresInDays: optionalCount.pipe(
    z.number().int().min(1).max(365).nullable(),
  ),
  maxUses: optionalCount.pipe(z.number().int().min(1).max(500).nullable()),
});

export const redeemCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((value) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
    .refine((value) => value.length >= 12 && value.length <= 40, {
      message: "Código inválido.",
    }),
});
