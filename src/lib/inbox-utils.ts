// ======================================
// INBOX UTILITIES - MINIMAL VERSION
// Lead Management & Basic Functions
// ======================================

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

// Inbox Stats interface
export interface InboxStats {
  totalBatches: number;
  totalLeads: number;
  averageQualityScore: number;
  storageUsed: number;
  storageLimit: number;
  mostCommonIndustry?: string;
  bestPerformingIndustry?: string;
  topLocation?: string;
}

// Basic storage functions
function getAllLeadBatchesFromStorage(): LeadBatch[] {
  try {
    const stored = localStorage.getItem(INBOX_BATCHES_STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored) as LeadBatch[];
  } catch (error) {
    console.error('Error loading lead batches:', error);
    return [];
  }
}

export function getAllLeadBatches(): LeadBatch[] {
  return getAllLeadBatchesFromStorage();
}

export function getLeadBatchById(batchId: string): LeadBatch | null {
  const batches = getAllLeadBatchesFromStorage();
  return batches.find(batch => batch.id === batchId) || null;
}

export function deleteLeadBatch(batchId: string): boolean {
  try {
    const batches = getAllLeadBatchesFromStorage();
    const filteredBatches = batches.filter(batch => batch.id !== batchId);
    
    if (batches.length === filteredBatches.length) {
      return false; // Batch not found
    }
    
    localStorage.setItem(INBOX_BATCHES_STORAGE_KEY, JSON.stringify(filteredBatches));
    return true;
  } catch (error) {
    console.error('Error deleting batch:', error);
    return false;
  }
}

export function getAllInboxStats(plan?: string, email?: string): InboxStats {
  try {
    const batches = getAllLeadBatchesFromStorage();
    const totalBatches = batches.length;
    const totalLeads = batches.reduce((sum, batch) => sum + batch.totalLeads, 0);
    const averageQualityScore = batches.length > 0 
      ? Math.round(batches.reduce((sum, batch) => sum + batch.stats.averageQualityScore, 0) / batches.length)
      : 0;
    const storageUsed = totalLeads;
    const storageLimit = getStorageLimit(plan, email);
    
    return {
      totalBatches,
      totalLeads,
      averageQualityScore,
      storageUsed,
      storageLimit,
    };
  } catch (error) {
    console.error('Error getting inbox stats:', error);
    return {
      totalBatches: 0,
      totalLeads: 0,
      averageQualityScore: 0,
      storageUsed: 0,
      storageLimit: 100,
    };
  }
}

export function getStorageLimit(plan?: string, email?: string): number {
  // Simple mapping based on plan type
  switch (plan) {
    case 'pro': return 1500;
    case 'solo': return 500;
    default: return 100; // lite
  }
}

// Simple insights generation
export function generateInsights(
  batch: LeadBatch,
  planLevel: 'basic' | 'limited' | 'full'
): any {
  try {
    const basic = {
      totalLeads: batch.totalLeads,
      verificationRate: Math.round((batch.stats.verifiedCount / batch.totalLeads) * 100),
      batchCreatedDate: new Date(batch.createdAt),
    };

    if (planLevel === 'basic') {
      return basic;
    }

    // Add more insights for limited and full plans
    return {
      ...basic,
      qualityBreakdown: {
        verified: batch.stats.verifiedCount,
        highQuality: Math.floor(batch.totalLeads * 0.3),
        mediumQuality: Math.floor(batch.totalLeads * 0.4),
        lowQuality: Math.floor(batch.totalLeads * 0.3),
      },
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      totalLeads: batch.totalLeads,
      verificationRate: 0,
      batchCreatedDate: new Date(),
    };
  }
}