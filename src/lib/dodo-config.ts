export const DODO_PLANS = {
  lite: {
    name: "Lite",
    monthlyProductId: "pdt_0NVQ9rgRmOekcDhpDIGsS",
    yearlyProductId: "pdt_0NVQAOmJnJNJM3dIsd2Ac",
    monthlyPrice: 9,
    yearlyPrice: 99,
    features: [
      "Basic access",
      "Inbox delivery only",
      "No CRM",
      "No Automations",
      "No Real-time Notifications",
      "No Advanced Analytics",
    ],
    featureAccess: {
      inboxDelivery: "inbox_only",
      icpMatching: "basic",
      crmAccess: false,
      crmIntegrations: false,
      automations: false,
      realtimeNotifications: false,
      advancedAnalytics: false,
    },
  },
  solo: {
    name: "Solo",
    monthlyProductId: "pdt_0NVQA6iIOkZ8LTKFuaylJ",
    yearlyProductId: "pdt_0NVQAXRCbQ92oAIejS0NB",
    monthlyPrice: 29,
    yearlyPrice: 319,
    recommended: true,
    features: [
      "Inbox delivery with insights",
      "Advanced features",
      "Limited CRM",
      "Limited Automations enabled",
      "- Pre-built email automation",
      "- Pre-built WhatsApp automation",
      "- Pre-built social media automation",
      "- Up to 5 active automations",
      "Real-time Notifications",
      "Limited Advanced Analytics",
    ],
    featureAccess: {
      inboxDelivery: "inbox_with_insights",
      icpMatching: "advanced",
      crmAccess: true,
      crmIntegrations: "limited",
      automations: "limited",
      realtimeNotifications: true,
      advancedAnalytics: "limited",
    },
  },
  pro: {
    name: "Pro",
    monthlyProductId: "pdt_0NVQAFTc6DAEBmEpHavd4",
    yearlyProductId: "pdt_0NVQAeAM8S260pmQn5Ekn",
    monthlyPrice: 69,
    yearlyPrice: 759,
    features: [
      "Inbox delivery with insights",
      "Advanced features",
      "Full CRM",
      "All Automations enabled",
      "- All pre-built automations (email, WhatsApp, social media)",
      "- Unlimited active automations",
      "- Custom automation builder",
      "- Advanced triggers & actions",
      "Real-time Notifications",
      "Full Advanced Analytics",
    ],
    featureAccess: {
      inboxDelivery: "inbox_with_insights",
      icpMatching: "advanced",
      crmAccess: true,
      crmIntegrations: "full",
      automations: "full",
      realtimeNotifications: true,
      advancedAnalytics: "full",
    },
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
