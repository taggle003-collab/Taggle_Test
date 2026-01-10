"use client";

import React from "react";
import BasicICPForm from "./icp/BasicICPForm";
import AdvancedICPForm from "./icp/AdvancedICPForm";
import { getICPMatchingLevel, getMaxSavedICPProfiles } from "@/lib/feature-access";

export interface ICPCriteria {
  industry: string;
  companySize: string;
  location: string;
  jobTitles: string[];
  annualRevenue?: string;
  fundingStage?: string;
  customICP?: string;
  qualityScore?: number;
}

interface ICPFormProps {
  onScrape: (criteria: ICPCriteria) => void;
  isLoading: boolean;
  searchesRemaining: number | null;
  rateLimitReset: string | null;
  countdown: string;
  userPlan?: "lite" | "solo" | "pro";
  userEmail?: string;
}

const ICPForm = ({ onScrape, isLoading, searchesRemaining, rateLimitReset, countdown, userPlan, userEmail }: ICPFormProps) => {
  const icpLevel = getICPMatchingLevel(userPlan, userEmail);
  const maxProfiles = getMaxSavedICPProfiles(userPlan, userEmail);

  // Route to appropriate form based on ICP matching level
  if (icpLevel === "basic") {
    return (
      <BasicICPForm
        onScrape={onScrape}
        isLoading={isLoading}
        searchesRemaining={searchesRemaining}
        rateLimitReset={rateLimitReset}
        countdown={countdown}
      />
    );
  }

  // Advanced matching for Solo and Pro
  // TypeScript guard: Advanced form is only shown when icpLevel is "advanced"
  // which means userPlan is either "solo" or "pro"
  const advancedPlan = (userPlan === "solo" || userPlan === "pro") ? userPlan : "solo";
  
  return (
    <AdvancedICPForm
      onScrape={onScrape}
      isLoading={isLoading}
      searchesRemaining={searchesRemaining}
      rateLimitReset={rateLimitReset}
      countdown={countdown}
      maxProfiles={maxProfiles}
      userPlan={advancedPlan}
    />
  );
};

export default ICPForm;
