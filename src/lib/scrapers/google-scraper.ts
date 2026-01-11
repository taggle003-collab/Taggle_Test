import { BaseScraper, ScrapedLead, ICPCriteria } from './base-scraper';

export class GoogleSearchScraper extends BaseScraper {
  constructor() {
    super('https://google.com', 'google');
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    const queries: string[] = [];
    const terms = this.generateSearchTerms(criteria);
    
    // Company searches
    if (criteria.industry) {
      queries.push(`"${criteria.industry}" companies ${criteria.location || ''}`);
      queries.push(`"${criteria.industry}" startups ${criteria.location || ''}`);
    }
    
    // Job title searches
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      for (const title of criteria.jobTitles) {
        queries.push(`"${title}" "${criteria.location || ''}" company`);
      }
    }
    
    // Custom ICP searches
    if (criteria.customICP) {
      queries.push(`"${criteria.customICP}" companies`);
      queries.push(`"${criteria.customICP}" professionals`);
    }
    
    // Company size specific searches
    if (criteria.companySize) {
      const sizeTerm = this.getSizeTerm(criteria.companySize);
      queries.push(`${sizeTerm} companies ${criteria.industry || ''} ${criteria.location || ''}`);
    }
    
    return queries;
  }

  private getSizeTerm(size: string): string {
    const sizeMap: Record<string, string> = {
      "1-10": "startup",
      "10-50": "small business", 
      "50-100": "mid-size company",
      "100-500": "growing company",
      "500-1000": "enterprise"
    };
    return sizeMap[size] || size;
  }

  async scrapePage(query: string, page: number = 1): Promise<Partial<ScrapedLead>[]> {
    try {
      // For demo purposes, simulate scraping results
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return this.generateMockGoogleResults(query);
    } catch (error) {
      console.error('Google search scraping error:', error);
      return [];
    }
  }

  private generateMockGoogleResults(query: string): Partial<ScrapedLead>[] {
    const results: Partial<ScrapedLead>[] = [];
    const companies = ['TechCorp Inc', 'Startuply LLC', 'InnovateCo Ltd', 'DataFlow Systems', 'CloudScale Solutions'];
    const titles = ['CEO', 'CTO', 'Founder', 'VP Sales', 'Marketing Director', 'Product Manager'];
    const industries = ['SaaS', 'Technology', 'Healthcare', 'Finance', 'E-commerce'];
    const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA'];
    
    for (let i = 0; i < 4; i++) {
      const firstName = this.getRandomName();
      const lastName = this.getRandomName();
      const company = companies[i % companies.length];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const industry = industries[Math.floor(Math.random() * industries.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      results.push({
        firstName,
        lastName,
        company,
        title,
        industry,
        location,
        companySize: '10-50',
        sourceUrl: `https://google.com/search?q=${encodeURIComponent(company + ' ' + firstName + ' ' + lastName)}`,
        verified: false,
        accuracy: 80,
        linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${company.toLowerCase().replace(/\s+/g, '-')}`
      });
    }
    
    return results;
  }

  private getRandomName(): string {
    const names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Alex', 'Emma', 'Ryan', 'Maya', 'Chris', 'Anna'];
    return names[Math.floor(Math.random() * names.length)];
  }

  extractContactInfo(content: string): string | null {
    // Extract email patterns from Google search results
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0] : null;
  }
}