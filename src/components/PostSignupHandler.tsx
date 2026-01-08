"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { DODO_PLANS } from "@/lib/dodo-config";

export default function PostSignupHandler() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Check for pending plan
    const pendingPlan = sessionStorage.getItem("pendingPlan");
    if (!pendingPlan) return;

    // Clear the pending plan
    sessionStorage.removeItem("pendingPlan");

    // Find the plan key that matches the pending plan
    const planKey = Object.keys(DODO_PLANS).find(
      key => DODO_PLANS[key].name.toLowerCase() === pendingPlan.toLowerCase()
    );

    if (!planKey) {
      console.warn("Unknown plan:", pendingPlan);
      return;
    }

    // Create checkout session
    const createCheckout = async () => {
      try {
        const userEmail =
          user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;

        if (!userEmail) {
          console.error("No email address found");
          return;
        }

        const response = await fetch("/api/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planKey,
            billingCycle: "monthly", // Default to monthly, can be enhanced later
            userEmail,
            userId: user.id,
            planName: DODO_PLANS[planKey].name,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            (data && (data.message || data.error)) ||
            `Failed to create checkout session (${response.status})`
          );
        }

        const checkoutUrl = data?.checkoutUrl ?? data?.checkout_url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        }
      } catch (error) {
        console.error("Payment error:", error);
        // Don't alert here as it might be disruptive
        // Instead, let the user manually try again
      }
    };

    createCheckout();
  }, [user, isLoaded, router]);

  return null; // This component doesn't render anything
}