"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminAuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");

    if (token) {
      window.localStorage.setItem("zyvora_admin_access_token", token);
      router.replace("/dashboard");
      return;
    }

    router.replace("/signin");
  }, [params, router]);

  return <main className="mx-auto max-w-3xl px-4 py-16">Finalizing admin sign in...</main>;
}

export default function AdminAuthCallbackPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-16">Finalizing admin sign in...</main>}>
      <AdminAuthCallbackContent />
    </Suspense>
  );
}
