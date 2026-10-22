import { z } from "zod";
import { CATEGORIES } from "./types";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ.")
  .refine((d) => !Number.isNaN(Date.parse(d)), "Date invalide.");

export const newToolSchema = z.object({
  name: z
    .string({ required_error: "Le nom est obligatoire." })
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères.")
    .max(60, "Le nom ne peut pas dépasser 60 caractères."),
  category: z.enum(CATEGORIES, {
    errorMap: () => ({ message: "Choisissez une catégorie parmi la liste." }),
  }),
  description: z
    .string()
    .trim()
    .max(300, "La description ne peut pas dépasser 300 caractères.")
    .optional()
    .default(""),
});
export type NewToolInput = z.input<typeof newToolSchema>;

export const newLoanSchema = z
  .object({
    toolId: z.string().min(1, "Outil manquant."),
    startDate: isoDate,
    endDate: isoDate,
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "La date de fin ne peut pas précéder la date de début.",
    path: ["endDate"],
  });
export type NewLoanInput = z.input<typeof newLoanSchema>;

export const decisionSchema = z.object({
  status: z.enum(["accepted", "refused"], {
    errorMap: () => ({ message: "Décision invalide (accepted ou refused)." }),
  }),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1, "Note entre 1 et 5.").max(5, "Note entre 1 et 5."),
});

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Données invalides.";
}
