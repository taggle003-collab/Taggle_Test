"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const tiers = [
    {
      name: "Lite",
      price: isYearly ? 9 * 10 : 9,
      description: "100 verified leads/month delivered to your inbox",
      features: [
        "Inbox delivery only",
        "Basic ICP matching",
        "No CRM or automation",
        "No Real-time Notifications",
        "No Advanced Analytics",
      ],
      buttonText: "Start Lite",
      recommended: false,
    },
    {
      name: "Solo",
      price: isYearly ? 29 * 10 : 29,
      description: "500 verified leads/month delivered to your inbox",
      features: [
        "Inbox delivery with insights",
        "Advanced ICP matching",
        "Limited CRM integrations",
        "Limited Automations enabled",
        "Real-time Notifications",
        "Limited Advanced Analytics",
      ],
      buttonText: "Get Solo",
      recommended: true,
    },
    {
      name: "Pro",
      price: isYearly ? 69 * 10 : 69,
      description: "1500 verified leads/month delivered to your inbox",
      features: [
        "Inbox delivery with insights",
        "Advanced ICP matching",
        "Full CRM integrations",
        "All Automations enabled",
        "Real-time Notifications",
        "Full Advanced Analytics",
      ],
      buttonText: "Go Pro",
      recommended: false,
    },
  ];

  return (
    <div id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-brand-black sm:text-4xl">
            Straightforward Pricing - You pay. We deliver. Simple.
          </h2>
          <div className="mt-6 flex justify-center items-center space-x-4">
            <span className={`text-sm ${!isYearly ? 'font-bold text-brand-black' : 'text-gray-500'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-brand-orange"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isYearly ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'font-bold text-brand-black' : 'text-gray-500'}`}>Yearly (2 months free)</span>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 bg-white border rounded-2xl shadow-sm ${
                tier.recommended ? "border-brand-orange ring-2 ring-brand-orange ring-opacity-50" : "border-gray-200"
              }`}
            >
              {tier.recommended && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-orange text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Recommended
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-brand-black">{tier.name}</h3>
                <p className="mt-4 flex items-baseline text-brand-black">
                  <span className="text-5xl font-extrabold tracking-tight">${tier.price}</span>
                  <span className="ml-1 text-xl font-semibold">/{isYearly ? "year" : "mo"}</span>
                </p>
                <p className="mt-6 text-gray-500">{tier.description}</p>

                <ul className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="flex-shrink-0 h-5 w-5 text-brand-orange" />
                      <span className="ml-3 text-base text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className={`mt-8 w-full py-3 px-6 rounded-md font-semibold transition-colors ${
                  tier.recommended
                    ? "bg-brand-orange text-white hover:bg-orange-600"
                    : "bg-gray-100 text-brand-black hover:bg-gray-200"
                }`}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
