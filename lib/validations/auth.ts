import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nom trop court").max(80, "Nom trop long"),
    email: z.string().min(1, "L'email est requis").email("Email invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Nom trop court").max(80, "Nom trop long"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Nom trop court").max(80, "Nom trop long"),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Email invalide"),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "8 caractères minimum"),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
