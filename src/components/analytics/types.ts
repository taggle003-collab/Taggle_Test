// Analytics data interfaces

export interface AnalyticsData {
  totalLeadsScrapped: number;
  leadsRemaining: number;
  industryDistribution: { industry: string; count: number }[];
  companySizeDistribution: { size: string; count: number }[];
  locationDistribution: { location: string; count: number }[];
  verificationRate: number;
  averageAccuracyScore: number;
  verifiedLeads: number;
  unverifiedLeads: number;
  campaignCount: number;
  averageLeadsPerCampaign: number;
  topCampaign: { name: string; leadCount: number; icp: string } | null;
}

export interface ExtendedAnalyticsData extends AnalyticsData {
  leadsByStatus: { status: string; count: number }[];
  conversionRates: { stage: string; rate: number }[];
  averageTimeToConversion: number; // in days
  estimatedDealValue: number;
  roi: number;
  industryPerformance: { industry: string; roi: number; conversionRate: number }[];
  companySizePerformance: { size: string; roi: number; conversionRate: number }[];
}