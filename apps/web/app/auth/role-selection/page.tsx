"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function RoleSelectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgSlug = searchParams.get("org");

  useEffect(() => {
    // Redirect to dashboard immediately, as role selection is now automated
    if (orgSlug) {
      router.replace(`/dashboard?org=${orgSlug}`);
    } else {
      router.replace("/dashboard");
    }
  }, [orgSlug, router]);

  // Return a loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="font-bold uppercase animate-pulse">REDIRECTING...</p>
    </div>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense>
      <RoleSelectionForm />
    </Suspense>
  );
}
