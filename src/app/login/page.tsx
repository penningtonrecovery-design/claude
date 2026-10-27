import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Fatherly Friend" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome. Pull up a chair."
      intro="Sign in or create your account. It only takes a moment."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
