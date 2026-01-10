// ======================================
// SHARED TYPES
// Common type definitions used across the app
// ======================================

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  linkedInProfile: string;
  verified: boolean;
  accuracy: number;
  founderName: string;
  founderTitle: string;
  founderImage: string;
  fundingStage?: string;
  annualRevenue?: string;
  matchQualityScore?: number;
  matchedCriteria?: string[];
}
