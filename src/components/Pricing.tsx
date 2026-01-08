"use client";

import { useState } from "react";
import { DODO_PLANS } from "@/lib/dodo-config";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type BillingCycle = "monthly" | "yearly";
type PlanKey = keyof typeof DODO_PLANS;

function PricingContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingPlanKey, setLoadingPlanKey] = useState<PlanKey | null>(null);

  const handlePayment = async (planKey: PlanKey) => {
    // Check if user is signed in
    if (!isLoaded || !user) {
      // Redirect to signup with plan parameter
      const planName = DODO_PLANS[planKey].name.toLowerCase();
      router.push(`/sign-up?plan=${planName}`);
      return;
    }

    const userEmail =
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      alert("No email address found for your account.");
      return;
    }

    setLoadingPlanKey(planKey);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          billingCycle,
          userEmail,
          userId: user.id,
          planName: DODO_PLANS[planKey].name,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && (data.message || data.error)) ||
          `Failed to create checkout session (${response.status})`;
        throw new Error(message);
      }

      const checkoutUrl = data?.checkoutUrl ?? data?.checkout_url;
      if (!checkoutUrl) {
        throw new Error("Checkout URL missing from server response");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to initiate payment. Please try again."
      );
    } finally {
      setLoadingPlanKey(null);
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Straightforward Pricing</h2>
          <p className="text-gray-400 mb-8">You pay. We deliver. Simple.</p>

          {/* Monthly/Yearly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingCycle === "monthly"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                billingCycle === "yearly"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="text-sm text-gray-400 ml-2">(Save 15%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(DODO_PLANS).map(([key, plan]) => {
            const planKey = key as PlanKey;
            const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isRecommended = planKey === "solo";

            return (
              <div
                key={planKey}
                className={`rounded-lg border-2 transition transform hover:scale-105 ${
                  isRecommended
                    ? "border-orange-600 bg-gradient-to-b from-orange-600/10 to-gray-800"
                    : "border-gray-700 bg-gray-800"
                }`}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className="bg-orange-600 text-white text-center py-2 font-semibold text-sm">
                    Recommended
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-orange-600">${price}</span>
                    <span className="text-gray-400">/mo</span>
                  </div>

                  {/* Lead Count */}
                  <p className="text-gray-400 mb-6">{plan.leads} verified leads/month</p>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePayment(planKey)}
                    disabled={loadingPlanKey === planKey}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 mb-8"
                  >
                    {loadingPlanKey === planKey
                      ? "Processing..."
                      : planKey === "lite"
                        ? "Start Lite"
                        : planKey === "solo"
                          ? "Get Solo"
                          : "Go Pro"}
                  </button>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-orange-600 mt-1">✓</span>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Wrapper component to handle SSR
export default function Pricing() {
  if (typeof window === 'undefined') {
    // Return a simple loading state during SSR
    return (
      <section id="pricing" className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Straightforward Pricing</h2>
            <p className="text-gray-400 mb-8">You pay. We deliver. Simple.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border-2 border-gray-700 bg-gray-800 p-8">
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded mb-6"></div>
                <div className="h-12 bg-gray-700 rounded mb-8"></div>
                <div className="h-10 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return <PricingContent />;
}
