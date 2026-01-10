// ======================================
// INBOX UTILITIES - CORE FUNCTIONS
// Lead Management & Insights Generation
// ======================================

import { getFeatureLevel } from './feature-access';
import { InboxStats } from '@/lib/inbox-types';

// Re-export InboxStats for convenience
export { InboxStats };

export interface LeadBatch {
  id: string;
  name: string;
  createdAt: string;
  deliveredAt?: string;
  totalLeads: number;
  leads: ScrapedLead[];
  icpCriteria?: any;
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
  scrapedDate: string;
  matchQualityScore?: number;
  matchedCriteria?: string[];
  engagementScore?: number;
  source?: string;
  accuracy?: number;
  revenue?: string;
  fundingStage?: string;
  duplicateOf?: string;
}

// Storage constants
export const INBOX_BATCHES_STORAGE_KEY = 'taggle_lead_batches';
export const INBOX_DELIVERIES_STORAGE_KEY = 'taggle_delivery_history';

// Color constants for quality badges
export const QUALITY_COLORS = {
  HIGH: '#22c55e', // Green
  MEDIUM: '#eab308', // Yellow
  LOW: '#6b7280', // Gray
};

// Utility functions
export function createLeadBatch(
  leads: ScrapedLead[],
  icpCriteria?: any,
  deliveryMethod: 'email' | 'in-app' | 'export' = 'in-app'
): LeadBatch {
  const batch: LeadBatch = {
    id: crypto.randomUUID(),
    name: generateBatchName(leads, icpCriteria),
    createdAt: new Date().toISOString(),
    deliveredAt: undefined,
    totalLeads: leads.length,
    leads,
    icpCriteria,
    deliveryMethods: {
      email: deliveryMethod === 'email',
      inApp: true,
      export: deliveryMethod === 'export' ? 'csv' : null,
    },
    stats: calculateBatchStats({ leads } as any),
  };

  // Save batch
  saveLeadBatchToStorage(batch);
  
  // Mark as delivered if email was sent
  if (deliveryMethod === 'email') {
    batch.deliveredAt = new Date().toISOString();
  }

  return batch;
}

function generateBatchName(leads: ScrapedLead[], icpCriteria?: any): string {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  if (icpCriteria?.industry) {
    const industry = Array.isArray(icpCriteria.industry) 
      ? icpCriteria.industry[0] 
      : icpCriteria.industry;
    return `${industry} Leads - ${date}`;
  }
  
  if (leads.length > 0) {
    const mostCommonIndustry = getMostCommonIndustry(leads);
    if (mostCommonIndustry && mostCommonIndustry !== 'Unknown') {
      return `${mostCommonIndustry} Leads - ${date}`;
    }
  }
  
  return `Leads ${date}`;
}

function getMostCommonIndustry(leads: ScrapedLead[]): string {
  const industryCounts = new Map<string, number>();
  
  leads.forEach(lead => {
    if (lead.industry) {
      industryCounts.set(lead.industry, (industryCounts.get(lead.industry) || 0) + 1);
    }
  });
  
  let mostCommon = '';
  let maxCount = 0;
  
  industryCounts.forEach((count, industry) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = industry;
    }
  });
  
  return mostCommon || 'Unknown';
}

export function getLeadBatchById(batchId: string): LeadBatch | null {
  const batches = getAllLeadBatchesFromStorage();
  return batches.find(batch => batch.id === batchId) || null;
}

export function getAllLeadBatches(): LeadBatch[] {
  return getAllLeadBatchesFromStorage();
}

export function deleteLeadBatch(batchId: string): boolean {
  const batches = getAllLeadBatchesFromStorage();
  const filteredBatches = batches.filter(batch => batch.id !== batchId);
  
  if (batches.length === filteredBatches.length) {
    return false; // Batch not found
  }
  
  localStorage.setItem(INBOX_BATCHES_STORAGE_KEY, JSON.stringify(filteredBatches));
  return true;
}

export function calculateBatchStats(batch: any): any {
  const { leads } = batch;
  if (!leads || leads.length === 0) {
    return {
      verifiedCount: 0,
      averageQualityScore: 0,
      averageAccuracy: 0,
      icpMatchPercentage: 0,
    };
  }

  const verifiedCount = leads.filter((lead: ScrapedLead) => lead.verified).length;
  const verifiedRate = (verifiedCount / leads.length) * 100;

  const totalQualityScore = leads.reduce(
    (sum: number, lead: ScrapedLead) => sum + (lead.matchQualityScore || 60),
    0
  );
  const averageQualityScore = Math.round(totalQualityScore / leads.length);

  const totalAccuracy = leads.reduce(
    (sum: number, lead: ScrapedLead) => sum + (lead.accuracy || 85),
    0
  );
  const averageAccuracy = Math.round((totalAccuracy / leads.length) / 5) * 5;

  const matchedLeads = leads.filter(
    (lead: ScrapedLead) => lead.matchedCriteria && lead.matchedCriteria.length > 0
  ).length;
  const icpMatchPercentage = Math.round((matchedLeads / leads.length) * 100);

  return {
    verifiedCount,
    averageQualityScore,
    averageAccuracy,
    icpMatchPercentage,
  };
}

export function generateInsights(
  batch: LeadBatch,
  planLevel: 'basic' | 'limited' | 'full'
): any {
  switch (planLevel) {
    case 'basic':
      return generateBasicInsights(batch);
    case 'limited':
      return generateLimitedInsights(batch);
    case 'full':
      return generateFullInsights(batch);
    default:
      return generateBasicInsights(batch);
  }
}

function generateBasicInsights(batch: LeadBatch) {
  return {
    totalLeads: batch.totalLeads,
    verificationRate: Math.round((batch.stats.verifiedCount / batch.totalLeads) * 100),
    batchCreatedDate: new Date(batch.createdAt),
  };
}

function generateLimitedInsights(batch: LeadBatch) {
  const basic = generateBasicInsights(batch);
  
  const qualityBreakdown = getQualityTierBreakdown(batch);
  const industryDistribution = getIndustryDistribution(batch);
  const companySizeDistribution = getCompanySizeDistribution(batch);
  const topLocations = getLocationDistribution(batch).slice(0, 5);
  
  const topIndustry = industryDistribution.length > 0 ? {
    industry: industryDistribution[0].industry,
    avgQuality: Math.round(batch.leads
      .filter(lead => lead.industry === industryDistribution[0].industry)
      .reduce((sum, lead) => sum + (lead.matchQualityScore || 60), 0) / industryDistribution[0].count)
  } : null;
  
  const recommendations = generateSoloRecommendations(batch, industryDistribution, topLocations);

  return {
    ...basic,
    qualityBreakdown,
    icpMatchPercentage: batch.stats.icpMatchPercentage,
    industryDistribution,
    companySizeDistribution,
    topLocations,
    topIndustry,
    recommendations,
  };
}

function generateFullInsights(batch: LeadBatch) {
  const limited = generateLimitedInsights(batch);
  
  const engagementScores = batch.leads.map(lead => ({
    leadId: lead.id,
    score: calculateEngagementScore(lead)
  }));
  
  const revenueDistribution = getRevenueDistribution(batch);
  const fundingStageDistribution = getFundingStageDistribution(batch);
  const jobTitleDistribution = getJobTitleDistribution(batch);
  const duplicates = detectDuplicates(batch);
  const roiEstimate = calculateROI(batch);
  
  const advancedRecommendations = generateProRecommendations(batch, roiEstimate, duplicates);

  return {
    ...limited,
    engagementScores,
    verificationRateWithConfidence: {
      rate: limited.verificationRate,
      confidence: Math.min(95, Math.max(70, limited.verificationRate))
    },
    revenueDistribution,
    fundingStageDistribution,
    jobTitleDistribution,
    qualityTierFunnel: generateQualityTierFunnel(batch),
    duplicates,
    roiEstimate,
    enrichmentOpportunities: detectEnrichmentOpportunities(batch),
    competitiveInsights: detectCompetitiveInsights(batch),
    advancedRecommendations,
  };
}

function getQualityTierBreakdown(batch: LeadBatch) {
  const leads = batch.leads;
  const verified = leads.filter(lead => lead.verified);
  const highQuality = leads.filter(lead => (lead.matchQualityScore || 0) >= 80);
  const mediumQuality = leads.filter(lead => {
    const score = lead.matchQualityScore || 0;
    return score >= 60 && score < 80;
  });
  const lowQuality = leads.filter(lead => (lead.matchQualityScore || 100) < 60);
  
  return {
    verified: verified.length,
    highQuality: highQuality.length,
    mediumQuality: mediumQuality.length,
    lowQuality: lowQuality.length,
  };
}

export function getIndustryDistribution(batch: LeadBatch) {
  const industryCounts = new Map<string, number>();
  
  batch.leads.forEach(lead => {
    if (lead.industry) {
      industryCounts.set(lead.industry, (industryCounts.get(lead.industry) || 0) + 1);
    }
  });
  
  return Array.from(industryCounts.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);
}

export function getCompanySizeDistribution(batch: LeadBatch) {
  const sizeCounts = new Map<string, number>();
  
  batch.leads.forEach(lead => {
    if (lead.companySize) {
      sizeCounts.set(lead.companySize, (sizeCounts.get(lead.companySize) || 0) + 1);
    }
  });
  
  return Array.from(sizeCounts.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.count - a.count);
}

export function getLocationDistribution(batch: LeadBatch) {
  const locationCounts = new Map<string, number>();
  
  batch.leads.forEach(lead => {
    if (lead.location) {
      locationCounts.set(lead.location, (locationCounts.get(lead.location) || 0) + 1);
    }
  });
  
  return Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
}

function getRevenueDistribution(batch: LeadBatch) {
  const revenueRanges = [
    { min: 0, max: 1, label: '< $1M' },
    { min: 1, max: 10, label: '$1M - $10M' },
    { min: 10, max: 100, label: '$10M - $100M' },
    { min: 100, max: Infinity, label: '$100M+' },
  ];
  
  const counts = new Map<string, number>();
  revenueRanges.forEach(range => counts.set(range.label, 0));
  
  batch.leads.forEach(lead => {
    if (lead.revenue) {
      const value = parseRevenueToMillions(lead.revenue);
      const range = revenueRanges.find(r => value >= r.min && value < r.max);
      if (range) {
        counts.set(range.label, (counts.get(range.label) || 0) + 1);
      }
    }
  });
  
  return Array.from(counts.entries())
    .filter(([_, count]) => count > 0)
    .map(([range, count]) => ({ range, count }));
}

function getFundingStageDistribution(batch: LeadBatch) {
  const fundingCounts = new Map<string, number>();
  
  batch.leads.forEach(lead => {
    if (lead.fundingStage) {
      fundingCounts.set(lead.fundingStage, (fundingCounts.get(lead.fundingStage) || 0) + 1);
    }
  });
  
  return Array.from(fundingCounts.entries())
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);
}

function getJobTitleDistribution(batch: LeadBatch) {
  const titleCounts = new Map<string, number>();
  
  batch.leads.forEach(lead => {
    if (lead.title) {
      const normalizedTitle = normalizeJobTitle(lead.title);
      titleCounts.set(normalizedTitle, (titleCounts.get(normalizedTitle) || 0) + 1);
    }
  });
  
  return Array.from(titleCounts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function parseRevenueToMillions(revenue: string): number {
  const cleaned = revenue.replace(/[$,M]/g, '');
  return parseFloat(cleaned) || 0;
}

function normalizeJobTitle(title: string): string {
  const patterns: { [key: string]: string[] } = {
    'CEO': ['ceo', 'chief executive', 'chief executive officer'],
    'CTO': ['cto', 'chief technology', 'chief technology officer'],
    'VP': ['vp', 'vice president', 'v.p'],
    'Director': ['director', 'dir'],
    'Manager': ['manager', 'mgr'],
  };
  
  const lowerTitle = title.toLowerCase();
  
  for (const [normalized, patternsList] of Object.entries(patterns)) {
    if (patternsList.some(pattern => lowerTitle.includes(pattern))) {
      return normalized;
    }
  }
  
  return title;
}

function calculateEngagementScore(lead: ScrapedLead): number {
  let score = 50; // Base score
  
  // Verification bonus
  if (lead.verified) score += 20;
  
  // Quality bonus
  const quality = lead.matchQualityScore || 60;
  if (quality >= 80) score += 15;
  else if (quality >= 60) score += 5;
  
  // Title-based engagement (executives more likely to respond)
  const title = lead.title?.toLowerCase() || '';
  if (title.includes('ceo') || title.includes('founder')) score += 10;
  else if (title.includes('vp') || title.includes('director')) score += 5;
  
  // Size bonus (smaller companies more responsive)
  const size = lead.companySize || '';
  if (size.includes('1-50') || size.includes('1-10')) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

function detectDuplicates(batch: LeadBatch) {
  const duplicates: any[] = [];
  const emailMap = new Map<string, string[]>(); // email -> [leadIds]
  
  batch.leads.forEach(lead => {
    const email = lead.email.toLowerCase();
    if (!emailMap.has(email)) {
      emailMap.set(email, []);
    }
    emailMap.get(email)!.push(lead.id);
  });
  
  emailMap.forEach((leadIds, email) => {
    if (leadIds.length > 1) {
      duplicates.push({
        groupId: crypto.randomUUID(),
        leadIds,
        commonFields: ['email'],
        potentialMatchQuality: 95,
      });
    }
  });
  
  return duplicates;
}

function generateQualityTierFunnel(batch: LeadBatch) {
  const tiers = getQualityTierBreakdown(batch);
  const total = batch.totalLeads;
  
  return [
    { tier: 'High Quality', count: tiers.highQuality, percentage: Math.round((tiers.highQuality / total) * 100) },
    { tier: 'Medium Quality', count: tiers.mediumQuality, percentage: Math.round((tiers.mediumQuality / total) * 100) },
    { tier: 'Low Quality', count: tiers.lowQuality, percentage: Math.round((tiers.lowQuality / total) * 100) },
  ];
}

function calculateROI(batch: LeadBatch) {
  // Simplified ROI calculation
  const highQualityCount = batch.leads.filter(lead => (lead.matchQualityScore || 0) >= 80).length;
  const engagementBoost = batch.leads.reduce((sum, lead) => {
    return sum + (calculateEngagementScore(lead) / 100);
  }, 0) / batch.leads.length;
  
  const estimatedConversion = (highQualityCount / batch.leads.length) * engagementBoost * 0.15; // 15% of engaged high-quality
  const estimatedValue = estimatedConversion * 1000; // Assume $1000 per converted lead
  
  return {
    estimatedConversion: Math.round(estimatedConversion * 100),
    estimatedValue: Math.round(estimatedValue),
  };
}

function detectEnrichmentOpportunities(batch: LeadBatch) {
  return batch.leads.filter(lead => !lead.revenue).map(lead => ({
    leadId: lead.id,
    missingFields: lead.revenue ? [] : ['revenue'],
    potentialImpact: 'High-value targeting',
    enrichmentValue: 25,
  }));
}

function detectCompetitiveInsights(batch: LeadBatch) {
  // Simplified - in real app would check against competitor database
  return batch.leads
    .filter(lead => lead.company.toLowerCase().includes('tech') && (lead.companySize || '').includes('100-500'))
    .slice(0, 5)
    .map(lead => ({
      companyName: lead.company,
      employeeCount: parseCompanySizeToNumber(lead.companySize || 'Unknown'),
      revenue: lead.revenue,
      relevance: lead.matchQualityScore || 50,
    }));
}

function parseCompanySizeToNumber(size: string): number {
  const match = size.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function generateSoloRecommendations(
  batch: LeadBatch,
  industryDistribution: { industry: string; count: number }[],
  topLocations: { location: string; count: number }[]
): string[] {
  const recommendations: string[] = [];
  
  if (batch.stats.icpMatchPercentage >= 70) {
    recommendations.push(`Strong match: ${batch.stats.icpMatchPercentage}% of leads meet ICP criteria`);
  }
  
  if (industryDistribution.length > 0) {
    const topIndustry = industryDistribution[0];
    const avgQuality = batch.leads
      .filter(lead => lead.industry === topIndustry.industry)
      .reduce((sum, lead) => sum + (lead.matchQualityScore || 60), 0) / topIndustry.count;
    
    if (avgQuality >= 80) {
      recommendations.push(`Top quality leads found in ${topIndustry.industry} industry (avg ${Math.round(avgQuality)}% accuracy)`);
    }
  }
  
  if (topLocations.length > 0) {
    recommendations.push(`Most leads from ${topLocations[0].location} - consider geo-targeting`);
  }
  
  if (batch.stats.averageQualityScore >= 80) {
    recommendations.push('Excellent lead quality - increase volume for this ICP');
  }
  
  return recommendations;
}

function generateProRecommendations(
  batch: LeadBatch,
  roiEstimate: { estimatedConversion: number; estimatedValue: number },
  duplicates: any[]
): any[] {
  const recommendations = [];
  
  recommendations.push({
    type: 'ROI',
    title: 'High Conversion Potential',
    description: `These leads have ${roiEstimate.estimatedConversion}% engagement potential`,
    impact: `Estimated $${roiEstimate.estimatedValue} in pipeline value`,
    action: 'Launch campaign within 24 hours',
    roiEstimate: roiEstimate.estimatedConversion,
  });
  
  if (duplicates.length > 0) {
    const duplicateCount = duplicates.reduce((sum, group) => sum + group.leadIds.length - 1, 0);
    recommendations.push({
      type: 'Duplicates',
      title: 'Duplicate Leads Detected',
      description: `${duplicateCount} duplicate leads found`,
      impact: 'Clean data improves accuracy',
      action: 'Review and merge duplicates',
    });
  }
  
  const enrichmentCount = detectEnrichmentOpportunities(batch).length;
  if (enrichmentCount > 0) {
    recommendations.push({
      type: 'Enrichment',
      title: 'Enrichment Opportunities',
      description: `${enrichmentCount} leads missing key data`,
      impact: 'Enriched data increases conversion by 25%',
      action: 'Enrich missing data',
      roiEstimate: 25,
    });
  }
  
  return recommendations;
}

// Storage helpers
function getAllLeadBatchesFromStorage(): LeadBatch[] {
  try {
    const stored = localStorage.getItem(INBOX_BATCHES_STORAGE_KEY);
    if (!stored) return [];

    const batches = JSON.parse(stored) as LeadBatch[];

    // Filter out old batches based on storage limits
    // Default to 'none' (lite) if no plan info available
    const now = new Date();
    const planLevel = getFeatureLevel(undefined, undefined, 'leadScraping');
    const daysToKeep = planLevel === 'full' ? 90 : planLevel === 'limited' ? 60 : 30;

    return batches.filter(batch => {
      const batchDate = new Date(batch.createdAt);
      const daysDiff = (now.getTime() - batchDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= daysToKeep;
    });
  } catch (error) {
    console.error('Error loading lead batches:', error);
    return [];
  }
}

function saveLeadBatchToStorage(batch: LeadBatch): void {
  const batches = getAllLeadBatchesFromStorage();
  batches.unshift(batch); // Add to beginning (newest first)
  
  localStorage.setItem(INBOX_BATCHES_STORAGE_KEY, JSON.stringify(batches));
}

// Helper to get storage limit based on plan
export function getStorageLimit(): number {
  const planLevel = getFeatureLevel(undefined, undefined, 'leadScraping');
  switch (planLevel) {
    case 'full': return 1500;
    case 'limited': return 500;
    default: return 100;
  }
}

export function getAllInboxStats(): InboxStats {
  const batches = getAllLeadBatchesFromStorage();
  const totalBatches = batches.length;
  const totalLeads = batches.reduce((sum, batch) => sum + batch.totalLeads, 0);
  const averageQualityScore = batches.length > 0 
    ? Math.round(batches.reduce((sum, batch) => sum + batch.stats.averageQualityScore, 0) / batches.length)
    : 0;
  const storageUsed = totalLeads;
  const storageLimit = getStorageLimit();
  
  const allLeads = batches.flatMap(batch => batch.leads);
  const mostCommonIndustry = getMostCommonIndustry(allLeads);
  const bestPerformingIndustry = getBestPerformingIndustry(allLeads);
  const topLocation = getTopLocation(allLeads);
  
  return {
    totalBatches,
    totalLeads,
    averageQualityScore,
    storageUsed,
    storageLimit,
    mostCommonIndustry,
    bestPerformingIndustry,
    topLocation,
  };
}

function getBestPerformingIndustry(leads: ScrapedLead[]): string {
  if (leads.length === 0) return 'Unknown';
  
  const industryScores = new Map<string, number[]>();
  
  leads.forEach(lead => {
    if (lead.industry && lead.matchQualityScore) {
      if (!industryScores.has(lead.industry)) {
        industryScores.set(lead.industry, []);
      }
      industryScores.get(lead.industry)!.push(lead.matchQualityScore);
    }
  });
  
  let bestIndustry = '';
  let bestAvgScore = 0;
  
  industryScores.forEach((scores, industry) => {
    const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    if (avg > bestAvgScore) {
      bestAvgScore = avg;
      bestIndustry = industry;
    }
  });
  
  return bestIndustry || 'Unknown';
}

function getTopLocation(leads: ScrapedLead[]): string {
  if (leads.length === 0) return 'Unknown';
  
  const locationCounts = new Map<string, number>();
  leads.forEach(lead => {
    if (lead.location) {
      locationCounts.set(lead.location, (locationCounts.get(lead.location) || 0) + 1);
    }
  });
  
  let topLocation = '';
  let maxCount = 0;
  
  locationCounts.forEach((count, location) => {
    if (count > maxCount) {
      maxCount = count;
      topLocation = location;
    }
  });
  
  return topLocation || 'Unknown';
}
