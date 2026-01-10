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
      "No CRM",
      "No Automations",
      "No Real-time Notifications",
      "No Advanced Analytics",
    ],
    featureAccess: {
      leadScraping: true,
      leadsPerMonth: 100,
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
    leads: 500,
    recommended: true,
    features: [
      "500 verified leads/month",
      "Inbox delivery with insights",
      "Advanced ICP matching",
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
      leadScraping: true,
      leadsPerMonth: 500,
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
    leads: 1500,
    features: [
      "1500 verified leads/month",
      "Inbox delivery with insights",
      "Advanced ICP matching",
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
      leadScraping: true,
      leadsPerMonth: 1500,
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
