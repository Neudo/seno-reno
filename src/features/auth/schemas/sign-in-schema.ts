import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Saisissez une adresse e-mail valide."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export type SignInValues = z.infer<typeof signInSchema>;
