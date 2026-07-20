import { z } from "zod";

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  role: z.enum(["owner", "editor", "viewer"]),
});
