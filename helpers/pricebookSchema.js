import { z } from "zod";

export const pricebookSchema = z.object({
  success: z.boolean(),
  data: z.object({
    code: z.string(),
    currency: z.string(),
    items: z.array(
      z.object({
        sku: z.string(),
        price: z.number()
      })
    )
  }),
  error: z.string().optional()
});
