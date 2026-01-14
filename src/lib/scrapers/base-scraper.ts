export interface ScrapedLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  linkedInProfile?: string;
  verified?: boolean;
  accuracy?: number;
  founderName?: string;
  founderTitle?: string;
  founderImage?: string;
  fundingStage?: string;
  annualRevenue?: string;
  matchQualityScore?: number;
  matchedCriteria?: string[];
  source:
    | "gemini"
    | "llm"
    | "reddit"
    | "twitter"
    | "youtube"
    | "google"
    | "instagram"
    | "facebook"
    | "discord";
  sourceUrl: string;
}

export interface ICPCriteria {
  location?: string;
  industry?: string;
  companySize?: string;
  jobTitles?: string[];
  customICP?: string;
  annualRevenue?: string;
  fundingStage?: string;
  qualityScore?: number;

  // Internal orchestrator options (not user-provided)
  desiredLeads?: number;
  isAdvancedMatching?: boolean;
}

export interface ScrapingResult {
  leads: ScrapedLead[];
  errors: string[];
  sources: string[];
}

export abstract class BaseScraper {
  protected readonly baseUrl: string;
  protected readonly _source: ScrapedLead["source"];

  constructor(baseUrl: string, source: ScrapedLead["source"]) {
    this.baseUrl = baseUrl;
    this._source = source;
  }

  get source(): ScrapedLead["source"] {
    return this._source;
  }

  abstract generateSearchQueries(criteria: ICPCriteria): string[];
  abstract scrapePage(query: string, page?: number): Promise<Partial<ScrapedLead>[]>;
  abstract extractContactInfo(content: string): string | null;

  protected generateSearchTerms(criteria: ICPCriteria): string[] {
    const terms: string[] = [];
    
    if (criteria.industry) {
      terms.push(criteria.industry.toLowerCase());
    }
    
    if (criteria.location) {
      terms.push(criteria.location.toLowerCase());
    }
    
    if (criteria.companySize) {
      const sizeMap: Record<string, string> = {
        "1-10": "startup",
        "10-50": "small business",
        "50-100": "mid-size",
        "100-500": "growing",
        "500-1000": "enterprise"
      };
      terms.push(sizeMap[criteria.companySize] || criteria.companySize.toLowerCase());
    }

    // Add custom ICP terms
    if (criteria.customICP) {
      const customTerms = criteria.customICP
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(term => term.length > 2);
      terms.push(...customTerms);
    }

    return terms;
  }

  protected createEmailPattern(name: string, company: string): string {
    // Extract domain from company name
    const domain = company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/llc|inc|corp|ltd|company/g, '') + '.com';
    
    // Try different email patterns
    const patterns = [
      `${name.toLowerCase().replace(/\s+/g, '.')}@${domain}`,
      `${name.toLowerCase().replace(/\s+/g, '')}@${domain}`,
      `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[1]?.toLowerCase() || 'user'}@${domain}`,
    ];
    
    return patterns[0]; // Return the most common pattern
  }

  protected calculateMatchScore(criteria: ICPCriteria, lead: Partial<ScrapedLead>): number {
    let score = 0;
    let maxScore = 0;
    
    if (criteria.industry) {
      maxScore += 25;
      if (lead.industry?.toLowerCase().includes(criteria.industry.toLowerCase())) {
        score += 25;
      }
    }
    
    if (criteria.location) {
      maxScore += 20;
      if (lead.location?.toLowerCase().includes(criteria.location.toLowerCase())) {
        score += 20;
      }
    }
    
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      maxScore += 30;
      if (criteria.jobTitles.some(title => 
        lead.title?.toLowerCase().includes(title.toLowerCase())
      )) {
        score += 30;
      }
    }
    
    if (criteria.companySize) {
      maxScore += 15;
      if (lead.companySize === criteria.companySize) {
        score += 15;
      }
    }
    
    if (criteria.customICP) {
      maxScore += 10;
      const customTerms = criteria.customICP.toLowerCase().split(/[,\s]+/);
      const content = `${lead.title} ${lead.company} ${lead.industry}`.toLowerCase();
      if (customTerms.some(term => content.includes(term))) {
        score += 10;
      }
    }
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 85;
  }

  protected getMatchedCriteria(criteria: ICPCriteria, lead: Partial<ScrapedLead>): string[] {
    const matched: string[] = [];
    
    if (criteria.industry && lead.industry?.toLowerCase().includes(criteria.industry.toLowerCase())) {
      matched.push('industry');
    }
    
    if (criteria.location && lead.location?.toLowerCase().includes(criteria.location.toLowerCase())) {
      matched.push('location');
    }
    
    if (criteria.jobTitles && criteria.jobTitles.some(title => 
      lead.title?.toLowerCase().includes(title.toLowerCase())
    )) {
      matched.push('job title');
    }
    
    if (criteria.companySize && lead.companySize === criteria.companySize) {
      matched.push('company size');
    }
    
    return matched;
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    const queries = this.generateSearchQueries(criteria);
    const allLeads: ScrapedLead[] = [];
    const errors: string[] = [];
    
    for (const query of queries) {
      try {
        const leads = await this.scrapePage(query);
        for (const lead of leads) {
          const matchScore = this.calculateMatchScore(criteria, lead);
          
          if (matchScore >= (criteria.qualityScore || 70)) {
            const fullLead: ScrapedLead = {
              id: `${this.source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              firstName: lead.firstName || '',
              lastName: lead.lastName || '',
              email: lead.email || this.createEmailPattern(
                `${lead.firstName || 'User'} ${lead.lastName || 'Lead'}`,
                lead.company || 'Company'
              ),
              company: lead.company || '',
              title: lead.title || '',
              location: lead.location || '',
              companySize: lead.companySize || 'Unknown',
              industry: lead.industry || criteria.industry || 'Unknown',
              linkedInProfile: lead.linkedInProfile,
              verified: lead.verified || false,
              accuracy: lead.accuracy || Math.min(matchScore + 10, 95),
              founderName: lead.founderName,
              founderTitle: lead.founderTitle,
              founderImage: lead.founderImage,
              fundingStage: lead.fundingStage,
              annualRevenue: lead.annualRevenue,
              matchQualityScore: matchScore,
              matchedCriteria: this.getMatchedCriteria(criteria, lead),
              source: this.source,
              sourceUrl: lead.sourceUrl || '',
            };
            
            allLeads.push(fullLead);
          }
        }
      } catch (error) {
        errors.push(`Error scraping ${query}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return {
      leads: allLeads,
      errors,
      sources: [this.source]
    };
  }
}