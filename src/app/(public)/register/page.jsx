import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { Spinner } from "@/components/shared/loading";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Create account", description: "Create your free Auctech Academy account." };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start learning, build projects and earn verifiable certificates"
      footer={
        <>
          Already have an account?{" "}
          <Link href={ROUTES.login} className="font-medium text-secondary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<Spinner />}>
        <RegisterForm />
      </Suspense>
    </AuthCard>
  );
}
