import { DODO_PLANS } from "./dodo-config";

type PlanType = keyof typeof DODO_PLANS | null | undefined;

export const hasFeature = (
  userPlan: PlanType,
  userEmail: string | undefined,
  featureName: string
): boolean => {
  if (userEmail === "taggle003@gmail.com") {
    return true;
  }

  if (!userPlan) return false;

  const planFeatures = DODO_PLANS[userPlan].featureAccess;

  switch (featureName) {
    case "leadScraping":
      return planFeatures.leadScraping;
    case "crmAccess":
      return planFeatures.crmAccess;
    case "crmIntegrations":
      return planFeatures.crmIntegrations !== false;
    case "automations":
      return planFeatures.automations !== false;
    case "realtimeNotifications":
      return planFeatures.realtimeNotifications;
    case "advancedAnalytics":
      return planFeatures.advancedAnalytics !== false;
    case "icpMatching":
      return true; // All plans have ICP matching
    default:
      return false;
  }
};

export const getFeatureLevel = (
  userPlan: PlanType,
  userEmail: string | undefined,
  featureName: string
): "none" | "limited" | "full" => {
  if (userEmail === "taggle003@gmail.com") {
    return "full";
  }

  if (!userPlan) return "none";

  const planFeatures = DODO_PLANS[userPlan].featureAccess;

  // Special handling for icpMatching which uses "basic" | "advanced" instead of standard values
  if (featureName === "icpMatching") {
    const icpLevel = planFeatures.icpMatching as string;
    if (icpLevel === "advanced") return "full";
    return "limited"; // "basic" maps to "limited"
  }

  const feature = planFeatures[featureName as keyof typeof planFeatures];

  if (feature === true || feature === "full") return "full";
  if (feature === "limited") return "limited";
  return "none";
};

export const getLeadsLimit = (userPlan: PlanType, userEmail: string | undefined): number => {
  if (userEmail === "taggle003@gmail.com") {
    return 999999;
  }

  if (!userPlan) return 0;
  return DODO_PLANS[userPlan].featureAccess.leadsPerMonth;
};

export const getICPMatchingLevel = (
  userPlan: PlanType,
  userEmail: string | undefined
): "basic" | "advanced" => {
  if (userEmail === "taggle003@gmail.com") {
    return "advanced";
  }

  if (!userPlan) return "basic";

  // Get the icpMatching value directly from the plan
  const icpLevel = DODO_PLANS[userPlan].featureAccess.icpMatching as string;
  if (icpLevel === "advanced") return "advanced";
  return "basic";
};

export const getMaxSavedICPProfiles = (
  userPlan: PlanType,
  userEmail: string | undefined
): number => {
  if (userEmail === "taggle003@gmail.com") {
    return 999;
  }

  if (!userPlan) return 0;

  if (userPlan === "solo") return 3;
  if (userPlan === "pro") return 999;
  return 0;
};
