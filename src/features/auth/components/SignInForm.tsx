import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/features/auth/context/AuthProvider";
import {
  signInSchema,
  type SignInValues,
} from "@/features/auth/schemas/sign-in-schema";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function SignInForm() {
  const navigate = useNavigate();
  const { signInWithPassword, status } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = async ({ email, password }: SignInValues) => {
    setFormError(null);

    try {
      await signInWithPassword(email, password);
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Connexion impossible. Réessayez.",
      );
    }
  };

  const isUnconfigured = status === "unconfigured";

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit)} noValidate>
      {isUnconfigured ? (
        <Alert className="border-seno-100 bg-seno-50 text-seno-900">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-seno-700">
            L’authentification sera disponible après la configuration de
            Supabase.
          </AlertDescription>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nom@entreprise.fr"
          type="email"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          autoComplete="current-password"
          type="password"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button
        className="h-9 w-full justify-between px-3"
        disabled={isSubmitting || isUnconfigured}
        size="lg"
      >
        {isSubmitting ? "Connexion en cours…" : "Se connecter"}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </form>
  );
}
