"use client";

import { useState } from "react";
import { DODO_PLANS } from "@/lib/dodo-config";
import { useUser } from "@clerk/nextjs";

export default function Pricing() {
  const { user, isLoaded } = useUser();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const handlePayment = async (productId: string, planName: string) => {
    if (!isLoaded || !user) {
      // Redirect to sign up
      window.location.href = "/sign-up";
      return;
    }

    setLoadingProductId(productId);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userEmail: user.emailAddresses[0].emailAddress,
          userId: user.id,
          planName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setLoadingProductId(null);
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
            const productId =
              billingCycle === "monthly"
                ? plan.monthlyProductId
                : plan.yearlyProductId;
            const price =
              billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isRecommended = key === "solo";

            return (
              <div
                key={key}
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
                    onClick={() => handlePayment(productId, plan.name)}
                    disabled={loadingProductId === productId}
                    className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 mb-8"
                  >
                    {loadingProductId === productId
                      ? "Processing..."
                      : key === "lite"
                      ? "Start Lite"
                      : key === "solo"
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