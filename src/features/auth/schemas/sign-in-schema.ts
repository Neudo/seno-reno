import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Saisis une adresse e-mail valide."),
  password: z.string().min(1, "Saisis ton mot de passe."),
});

export type SignInValues = z.infer<typeof signInSchema>;
