import { SignInForm } from "@/features/auth/components/SignInForm";

export function SignInPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-white px-5 py-10">
      <section className="w-full max-w-sm">
        <img
          alt="SENO Rénovation"
          className="mx-auto h-auto w-full max-w-[210px]"
          src="/logo.avif"
        />

        <div className="mt-10">
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
