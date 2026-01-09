"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  
  useEffect(() => {
    // Store the plan in sessionStorage so it can be accessed after signup
    if (plan) {
      sessionStorage.setItem("pendingPlan", plan);
    }
  }, [plan]);

  const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Start Your 7-Day Free Trial</h1>
        <p className="text-gray-400">Join Taggle and start getting verified leads today.</p>
      </div>
      <div className="w-full max-w-md">
        {isClerkConfigured ? (
          <SignUp 
            afterSignUpUrl="/dashboard"
            afterSignInUrl="/dashboard"
          />
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-white">
            <h1 className="text-xl font-semibold">Authentication not configured</h1>
            <p className="mt-2 text-sm text-gray-300">
              Please set <code className="text-white">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to enable sign up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
