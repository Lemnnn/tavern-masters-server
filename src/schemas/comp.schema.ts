import { z } from "zod";

export const compSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  coreCards: z.array(z.string().url()),
  addonCards: z.array(z.string().url()),
  heroCards: z.array(z.string().url()),
  spellCards: z.array(z.string().url()),
  created_at: z.string().transform((v) => new Date(v).toISOString()),
  created_by: z.string().uuid(),
});

export type TComp = z.infer<typeof compSchema>;
