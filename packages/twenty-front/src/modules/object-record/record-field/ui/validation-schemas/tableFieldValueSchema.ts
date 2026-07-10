import { z } from 'zod';

// TABLE value: { cells: (string | number | null)[][] } | null
export const tableFieldValueSchema = z
  .object({
    cells: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
  })
  .nullable();
