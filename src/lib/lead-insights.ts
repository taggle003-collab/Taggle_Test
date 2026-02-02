// ======================================
// LEAD INSIGHTS GENERATION
// Plan-based insights for Solo and Pro plans
// ======================================

import { Lead, LeadSearchResult } from './lead-types';

export interface SoloLeadInsights {
  totalLeads: number;
  leadsWithWebsite: number;
  leadsWithSocialMedia: number;
  topIndustries: { industry: string; count: number; percentage: number }[];
  topCountries: { country: string; count: number; percentage: number }[];
  emailContactRate: number; // percentage
  phoneContactRate: number; // percentage
  websiteAvailability: number; // percentage
  socialMediaPresence: number; // percentage
  averageLeadScore: number; // 0-100
  basicEngagementScore: number; // 0-100
}

export interface ProLeadInsights extends SoloLeadInsights {
  // Website analysis
  websiteMetadata: {
    hasTitle: number;
    hasDescription: number;
    averageLoadTime: number; // simulated
  };
  techStackDetection: {
    wordpress: number;
    shopify: number;
    custom: number;
    unknown: number;
  };
  companySizeEstimation: {
    small: number; // 1-50
    medium: number; // 51-500
    large: number; // 500+
    unknown: number;
  };
  
  // Social media analysis
  socialMediaMetrics: {
    totalReach: number; // combined follower estimates
    averageActivity: number; // 0-100 (simulated)
    platformDistribution: {
      instagram: number;
      linkedin: number;
      twitter: number;
      facebook: number;
      youtube: number;
      other: number;
    };
  };
  
  // Lead quality scoring
  leadScoreDistribution: {
    excellent: number; // 81-100
    good: number; // 61-80
    average: number; // 41-60
    poor: number; // 0-40
  };
  
  // Industry trend analysis
  industryTrends: {
    emerging: string[];
    stable: string[];
    declining: string[];
  };
  
  // Growth potential indicators
  growthPotential: {
    high: number;
    medium: number;
    low: number;
  };
  
  // Competitive analysis
  competitiveInsights: {
    totalCompetitors: number;
    marketConcentration: 'high' | 'medium' | 'low';
    keyCompetitors: string[];
  };
}

// Helper function to calculate lead score
const calculateLeadScore = (lead: Lead | LeadSearchResult): number => {
  let score = 0;
  
  // Has email: +30 points
  if ('email' in lead && lead.email && lead.email.trim() !== '') {
    score += 30;
  }
  
  // Has phone: +20 points
  if ('phone' in lead && lead.phone && lead.phone.trim() !== '') {
    score += 20;
  }
  
  // Has website: +20 points
  if ('website' in lead && lead.website && lead.website.trim() !== '') {
    score += 20;
  }
  
  // Has social media: +20 points for 3+ links
  if ('socialMedia' in lead && lead.socialMedia) {
    const socialLinks = lead.socialMedia.toString().split(/[,\n;]/).filter(Boolean);
    if (socialLinks.length >= 3) {
      score += 20;
    }
  }
  
  // Complete company info: +10 points
  const hasCompany = 'company' in lead && lead.company && lead.company.trim() !== '';
  const hasIndustry = 'industry' in lead && lead.industry && lead.industry.trim() !== '';
  const hasLocation = 'location' in lead && lead.location && lead.location.trim() !== '';
  
  if (hasCompany && hasIndustry && hasLocation) {
    score += 10;
  }
  
  return Math.min(score, 100);
};

// Generate Solo plan insights
export const generateSoloInsights = (leads: (Lead | LeadSearchResult)[]): SoloLeadInsights => {
  const totalLeads = leads.length;
  if (totalLeads === 0) {
    return {
      totalLeads: 0,
      leadsWithWebsite: 0,
      leadsWithSocialMedia: 0,
      topIndustries: [],
      topCountries: [],
      emailContactRate: 0,
      phoneContactRate: 0,
      websiteAvailability: 0,
      socialMediaPresence: 0,
      averageLeadScore: 0,
      basicEngagementScore: 0,
    };
  }

  // Count leads with website
  const leadsWithWebsite = leads.filter(lead => 
    'website' in lead && lead.website && lead.website.trim() !== ''
  ).length;

  // Count leads with social media (3+ links)
  const leadsWithSocialMedia = leads.filter(lead => {
    if (!('socialMedia' in lead) || !lead.socialMedia) return false;
    const socialLinks = lead.socialMedia.toString().split(/[,\n;]/).filter(Boolean);
    return socialLinks.length >= 3;
  }).length;

  // Calculate email contact rate
  const leadsWithEmail = leads.filter(lead => 
    'email' in lead && lead.email && lead.email.trim() !== ''
  ).length;
  const emailContactRate = Math.round((leadsWithEmail / totalLeads) * 100);

  // Calculate phone contact rate
  const leadsWithPhone = leads.filter(lead => 
    'phone' in lead && lead.phone && lead.phone.trim() !== ''
  ).length;
  const phoneContactRate = Math.round((leadsWithPhone / totalLeads) * 100);

  // Calculate website availability
  const websiteAvailability = Math.round((leadsWithWebsite / totalLeads) * 100);

  // Calculate social media presence
  const socialMediaPresence = Math.round((leadsWithSocialMedia / totalLeads) * 100);

  // Calculate average lead score
  const totalLeadScore = leads.reduce((sum, lead) => sum + calculateLeadScore(lead), 0);
  const averageLeadScore = Math.round(totalLeadScore / totalLeads);

  // Top industries
  const industryCount: Record<string, number> = {};
  leads.forEach(lead => {
    const industry = 'industry' in lead && lead.industry ? lead.industry : 'Unknown';
    industryCount[industry] = (industryCount[industry] || 0) + 1;
  });
  const topIndustries = Object.entries(industryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([industry, count]) => ({
      industry,
      count,
      percentage: Math.round((count / totalLeads) * 100),
    }));

  // Top countries
  const countryCount: Record<string, number> = {};
  leads.forEach(lead => {
    const location = 'location' in lead && lead.location ? lead.location : 'Unknown';
    // Extract country from location (simplified)
    const parts = location.split(',');
    const country = parts[parts.length - 1]?.trim() || 'Unknown';
    countryCount[country] = (countryCount[country] || 0) + 1;
  });
  const topCountries = Object.entries(countryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / totalLeads) * 100),
    }));

  // Basic engagement score (simulated based on data completeness)
  const basicEngagementScore = Math.min(
    Math.round(
      (emailContactRate * 0.4) + 
      (phoneContactRate * 0.3) + 
      (websiteAvailability * 0.2) + 
      (socialMediaPresence * 0.1)
    ),
    100
  );

  return {
    totalLeads,
    leadsWithWebsite,
    leadsWithSocialMedia,
    topIndustries,
    topCountries,
    emailContactRate,
    phoneContactRate,
    websiteAvailability,
    socialMediaPresence,
    averageLeadScore,
    basicEngagementScore,
  };
};

// Generate Pro plan insights
export const generateProInsights = (leads: (Lead | LeadSearchResult)[]): ProLeadInsights => {
  const soloInsights = generateSoloInsights(leads);
  const totalLeads = leads.length;

  if (totalLeads === 0) {
    return {
      ...soloInsights,
      websiteMetadata: { hasTitle: 0, hasDescription: 0, averageLoadTime: 0 },
      techStackDetection: { wordpress: 0, shopify: 0, custom: 0, unknown: totalLeads },
      companySizeEstimation: { small: 0, medium: 0, large: 0, unknown: totalLeads },
      socialMediaMetrics: {
        totalReach: 0,
        averageActivity: 0,
        platformDistribution: { instagram: 0, linkedin: 0, twitter: 0, facebook: 0, youtube: 0, other: 0 },
      },
      leadScoreDistribution: { excellent: 0, good: 0, average: 0, poor: totalLeads },
      industryTrends: { emerging: [], stable: [], declining: [] },
      growthPotential: { high: 0, medium: 0, low: totalLeads },
      competitiveInsights: { totalCompetitors: 0, marketConcentration: 'low', keyCompetitors: [] },
    };
  }

  // Website metadata analysis (simulated)
  const websitesWithTitle = Math.floor(totalLeads * 0.6);
  const websitesWithDescription = Math.floor(totalLeads * 0.45);
  const averageLoadTime = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds

  // Tech stack detection (simulated)
  const wordpressCount = Math.floor(totalLeads * 0.25);
  const shopifyCount = Math.floor(totalLeads * 0.15);
  const customCount = Math.floor(totalLeads * 0.35);
  const unknownTechCount = totalLeads - wordpressCount - shopifyCount - customCount;

  // Company size estimation (simulated based on industry patterns)
  const smallCount = Math.floor(totalLeads * 0.4);
  const mediumCount = Math.floor(totalLeads * 0.35);
  const largeCount = Math.floor(totalLeads * 0.15);
  const unknownSizeCount = totalLeads - smallCount - mediumCount - largeCount;

  // Social media analysis
  let totalReach = 0;
  const platformCount = { instagram: 0, linkedin: 0, twitter: 0, facebook: 0, youtube: 0, other: 0 };
  
  leads.forEach(lead => {
    if (!('socialMedia' in lead) || !lead.socialMedia) return;
    
    const socialLinks = lead.socialMedia.toString().split(/[,\n;]/).filter(Boolean);
    totalReach += socialLinks.length * Math.floor(Math.random() * 1000) + 500; // Simulated reach
    
    socialLinks.forEach(link => {
      const linkLower = link.toLowerCase();
      if (linkLower.includes('instagram')) platformCount.instagram++;
      else if (linkLower.includes('linkedin')) platformCount.linkedin++;
      else if (linkLower.includes('twitter') || linkLower.includes('x.com')) platformCount.twitter++;
      else if (linkLower.includes('facebook')) platformCount.facebook++;
      else if (linkLower.includes('youtube')) platformCount.youtube++;
      else platformCount.other++;
    });
  });

  // Lead score distribution
  const scoreDistribution = { excellent: 0, good: 0, average: 0, poor: 0 };
  leads.forEach(lead => {
    const score = calculateLeadScore(lead);
    if (score >= 81) scoreDistribution.excellent++;
    else if (score >= 61) scoreDistribution.good++;
    else if (score >= 41) scoreDistribution.average++;
    else scoreDistribution.poor++;
  });

  // Industry trend analysis (simulated)
  const industries = soloInsights.topIndustries.map(i => i.industry);
  const industryTrends = {
    emerging: industries.slice(0, 2),
    stable: industries.slice(2, 4),
    declining: industries.slice(4, 5),
  };

  // Growth potential indicators (simulated)
  const highGrowthCount = Math.floor(totalLeads * 0.25);
  const mediumGrowthCount = Math.floor(totalLeads * 0.4);
  const lowGrowthCount = totalLeads - highGrowthCount - mediumGrowthCount;

  // Competitive analysis (simulated)
  const keyCompetitors = leads
    .filter(lead => 'company' in lead && lead.company)
    .map(lead => (lead as Lead).company)
    .filter((company, index, self) => self.indexOf(company) === index)
    .slice(0, 5);

  return {
    ...soloInsights,
    websiteMetadata: {
      hasTitle: websitesWithTitle,
      hasDescription: websitesWithDescription,
      averageLoadTime,
    },
    techStackDetection: {
      wordpress: wordpressCount,
      shopify: shopifyCount,
      custom: customCount,
      unknown: unknownTechCount,
    },
    companySizeEstimation: {
      small: smallCount,
      medium: mediumCount,
      large: largeCount,
      unknown: unknownSizeCount,
    },
    socialMediaMetrics: {
      totalReach,
      averageActivity: Math.floor(Math.random() * 40) + 60, // 60-100%
      platformDistribution: platformCount,
    },
    leadScoreDistribution: scoreDistribution,
    industryTrends,
    growthPotential: {
      high: highGrowthCount,
      medium: mediumGrowthCount,
      low: lowGrowthCount,
    },
    competitiveInsights: {
      totalCompetitors: keyCompetitors.length,
      marketConcentration: keyCompetitors.length > 3 ? 'medium' : 'low',
      keyCompetitors,
    },
  };
};

// Generate insights based on plan
export const generateLeadInsights = (
  leads: (Lead | LeadSearchResult)[],
  plan: 'solo' | 'pro' = 'solo'
) => {
  if (plan === 'pro') {
    return generateProInsights(leads);
  }
  return generateSoloInsights(leads);
};
