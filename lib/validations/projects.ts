import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().trim().min(3, "O título precisa ter pelo menos 3 caracteres.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});
