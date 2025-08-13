import { z } from "zod";

export const sponsorSchema = z.object({
  kbli: z.array(z.string()),
  fit_for: z.array(z.string()),
  gaps: z.array(z.string()),
  actions: z.array(z.string())
});
