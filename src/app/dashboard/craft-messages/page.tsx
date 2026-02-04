"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CraftMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
