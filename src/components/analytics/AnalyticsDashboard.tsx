"use client";

import React from "react";
import { getFeatureLevel } from "@/lib/feature-access";
import UpgradePrompt from "@/components/UpgradePrompt";
import LimitedAnalytics from "./LimitedAnalytics";
import FullAnalytics from "./FullAnalytics";

interface AnalyticsDashboardProps {
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

const AnalyticsDashboard = ({ userPlan, userEmail }: AnalyticsDashboardProps) => {
  const analyticsLevel = getFeatureLevel(userPlan, userEmail, "advancedAnalytics");

  // Lite plan - No access to analytics
  if (analyticsLevel === "none") {
    return (
      <UpgradePrompt
        requiredPlan="solo"
        featureName="Limited Analytics"
        description="Upgrade to Solo plan to unlock Limited Analytics and view insights about your lead campaigns, ICP distribution, and success rates."
      />
    );
  }

  // Solo plan - Limited analytics
  if (analyticsLevel === "limited") {
    return <LimitedAnalytics userPlan={userPlan} userEmail={userEmail} />;
  }

  // Pro plan or admin - Full analytics
  return <FullAnalytics userPlan={userPlan} userEmail={userEmail} />;
};

export default AnalyticsDashboard;