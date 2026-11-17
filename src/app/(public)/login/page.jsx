import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { Spinner } from "@/components/shared/loading";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Login", description: "Sign in to your Auctech Academy account." };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue learning"
      footer={
        <>
          New to Auctech?{" "}
          <Link href={ROUTES.register} className="font-medium text-secondary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<Spinner />}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
