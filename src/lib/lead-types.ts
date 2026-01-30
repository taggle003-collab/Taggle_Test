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
  website?: string;
  phone?: string;
  openHours?: string;
  socialMedia?: string;
  // Optional fields from scrapers
  source?:
    | "gemini"
    | "llm"
    | "kaggle"
    | "reddit"
    | "twitter"
    | "youtube"
    | "google"
    | "instagram"
    | "facebook"
    | "discord";
  sourceUrl?: string;
  matchedCriteria?: string[];
  matchQualityScore?: number;
  fundingStage?: string;
  annualRevenue?: string;
}

export interface LeadSearchResult {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  openHours?: string;
  socialMedia?: string[];
  category: string;
  country: string;
  companySize?: string;
  industrySubcategory?: string;
  company?: string;
  title?: string;
  location?: string;
}
