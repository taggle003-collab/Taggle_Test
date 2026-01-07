export const DODO_PLANS = {
  lite: {
    name: "Lite",
    monthlyProductId: "pdt_0NVQ9rgRmOekcDhpDIGsS",
    yearlyProductId: "pdt_0NVQAOmJnJNJM3dIsd2Ac",
    monthlyPrice: 9,
    yearlyPrice: 99,
    leads: 100,
    features: [
      "100 verified leads/month",
      "Inbox delivery only",
      "Basic ICP matching",
      "No CRM or automation",
      "No Real-time Notifications",
      "No Advanced Analytics",
    ],
  },
  solo: {
    name: "Solo",
    monthlyProductId: "pdt_0NVQA6iIOkZ8LTKFuaylJ",
    yearlyProductId: "pdt_0NVQAXRCbQ92oAIejS0NB",
    monthlyPrice: 29,
    yearlyPrice: 319,
    leads: 500,
    features: [
      "500 verified leads/month",
      "Inbox delivery with insights",
      "Advanced ICP matching",
      "Limited CRM integrations",
      "Limited Automations enabled",
      "Real-time Notifications",
      "Limited Advanced Analytics",
    ],
  },
  pro: {
    name: "Pro",
    monthlyProductId: "pdt_0NVQAFTc6DAEBmEpHavd4",
    yearlyProductId: "pdt_0NVQAeAM8S260pmQn5Ekn",
    monthlyPrice: 69,
    yearlyPrice: 759,
    leads: 1500,
    features: [
      "1500 verified leads/month",
      "Inbox delivery with insights",
      "Advanced ICP matching",
      "Full CRM integrations",
      "All Automations enabled",
      "Real-time Notifications",
      "Full Advanced Analytics",
    ],
  },
};

export const getPlanByProductId = (productId: string) => {
  for (const [planKey, plan] of Object.entries(DODO_PLANS)) {
    if (plan.monthlyProductId === productId || plan.yearlyProductId === productId) {
      const billingCycle = plan.monthlyProductId === productId ? "monthly" : "yearly";
      return { planKey, ...plan, billingCycle };
    }
  }
  return null;
};