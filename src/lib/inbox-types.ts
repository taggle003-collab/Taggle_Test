// ======================================
// INBOX SYSTEM - TYPESCRIPT INTERFACES
// Plan-based Inbox Delivery with Insights
// ======================================

export interface LeadBatch {
  id: string;
  name: string;
  createdAt: string; // ISO date string
  deliveredAt?: string; // ISO date string
  totalLeads: number;
  leads: ScrapedLead[];
  icpCriteria?: {
    industry?: string[];
    companySize?: string[];
    location?: string[];
    jobTitles?: string[];
    annualRevenue?: string;
    fundingStage?: string[];
    qualityScoreMin?: number;
  };
  deliveryMethods: {
    email?: boolean;
    inApp: boolean;
    export?: 'csv' | 'pdf' | null;
  };
  stats: {
    verifiedCount: number;
    averageQualityScore: number;
    averageAccuracy: number;
    icpMatchPercentage: number;
  };
}

export interface ScrapedLead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  location: string;
  verified: boolean;
  industry?: string;
  companySize?: string;
  notes?: string;
  scrapedDate: string; // ISO date string
  matchQualityScore?: number; // 0-100
  matchedCriteria?: string[];
  engagementScore?: number; // 0-100 (Pro only)
  source?: string;
  accuracy?: number; // percentage
  revenue?: string;
  fundingStage?: string;
  duplicateOf?: string;
}

export interface DeliveryRecord {
  id: string;
  batchId: string;
  batchName: string;
  deliveredAt: string; // ISO date string
  leadCount: number;
  deliveryMethod: 'email' | 'export' | 'in-app';
  email?: string;
  filename?: string;
}

// ======================================
// INSIGHTS INTERFACES - PLAN BASED
// ======================================

// Basic Insights (Lite Plan)
export interface BasicInsights {
  totalLeads: number;
  verificationRate: number; // percentage
  batchCreatedDate: Date;
}

// Limited Insights (Solo Plan)
export interface LimitedInsights extends BasicInsights {
  qualityBreakdown: {
    verified: number;
    highQuality: number;
    mediumQuality: number;
    lowQuality: number;
  };
  icpMatchPercentage: number;
  industryDistribution: { industry: string; count: number }[];
  companySizeDistribution: { size: string; count: number }[];
  topLocations: { location: string; count: number }[];
  topIndustry: { industry: string; avgQuality: number } | null;
  recommendations: string[];
}

// Full Insights (Pro Plan)
export interface FullInsights extends LimitedInsights {
  engagementScores: { leadId: string; score: number }[];
  verificationRateWithConfidence: { rate: number; confidence: number };
  revenueDistribution?: { range: string; count: number }[];
  fundingStageDistribution?: { stage: string; count: number }[];
  jobTitleDistribution: { title: string; count: number }[];
  qualityTierFunnel: { tier: string; count: number; percentage: number }[];
  duplicates: DuplicateGroup[];
  roiEstimate: { estimatedConversion: number; estimatedValue: number };
  enrichmentOpportunities: EnrichmentOpportunity[];
  competitiveInsights: CompetitiveInsight[];
  advancedRecommendations: AdvancedRecommendation[];
}

export interface DuplicateGroup {
  groupId: string;
  leadIds: string[];
  commonFields: string[];
  potentialMatchQuality: number;
}

export interface EnrichmentOpportunity {
  leadId: string;
  missingFields: string[];
  potentialImpact: string;
  enrichmentValue: number;
}

export interface CompetitiveInsight {
  companyName: string;
  employeeCount: number;
  revenue?: string;
  relevance: number;
}

export interface AdvancedRecommendation {
  type: string;
  title: string;
  description: string;
  impact: string;
  action?: string;
  roiEstimate?: number;
}

export interface InboxStats {
  totalBatches: number;
  totalLeads: number;
  averageQualityScore: number;
  storageUsed: number; // out of plan limit
  storageLimit: number;
  mostCommonIndustry: string;
  bestPerformingIndustry: string;
  topLocation: string;
}

export interface InsightCardData {
  title: string;
  icon: string;
  metric: string | number;
  trend?: string;
  description?: string;
}
