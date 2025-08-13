import { z } from "zod";

export const permitSchema = z.object({
  success: z.boolean(),
  status: z.number(),
  summary: z.string(),
  data: z.object({
    permitId: z.string(),
    valid: z.boolean()
  })
});
