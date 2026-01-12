import { BaseScraper, ScrapedLead, ICPCriteria } from './base-scraper';

export class TwitterScraper extends BaseScraper {
  constructor() {
    super('https://x.com', 'twitter');
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    const queries: string[] = [];
    const terms = this.generateSearchTerms(criteria);
    
    // Twitter/X search queries
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      for (const title of criteria.jobTitles) {
        queries.push(`site:x.com ${title} ${terms.join(' ')}`);
        queries.push(`site:twitter.com ${title} ${terms.join(' ')}`);
      }
    }
    
    // Industry-specific searches
    if (criteria.industry) {
      queries.push(`site:x.com "${criteria.industry}" founder`);
      queries.push(`site:twitter.com "${criteria.industry}" CEO`);
      queries.push(`site:x.com "${criteria.industry}" startup`);
    }
    
    // Location-based searches
    if (criteria.location) {
      queries.push(`site:x.com ${criteria.location} ${terms.join(' ')}`);
      queries.push(`site:twitter.com ${criteria.location} startup`);
    }
    
    return queries;
  }

  async scrapePage(query: string, page: number = 1): Promise<Partial<ScrapedLead>[]> {
    try {
      // Simulate Twitter scraping delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      return this.generateMockTwitterResults(query);
    } catch (error) {
      console.error('Twitter scraping error:', error);
      return [];
    }
  }

  private generateMockTwitterResults(query: string): Partial<ScrapedLead>[] {
    const results: Partial<ScrapedLead>[] = [];
    const companies = ['TechFlow', 'DataMinds', 'CloudVenture', 'InnovateHub', 'ScaleUp'];
    const titles = ['Founder & CEO', 'Co-founder', 'VP Engineering', 'Growth Lead', 'Product Lead'];
    const industries = ['SaaS', 'Tech', 'AI/ML', 'Fintech', 'Healthtech'];
    const locations = ['USA', 'San Francisco', 'New York', 'Austin', 'London'];
    
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
        sourceUrl: `https://x.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        verified: false,
        accuracy: 75,
        linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${company.toLowerCase().replace(/\s+/g, '-')}`
      });
    }
    
    return results;
  }

  private getRandomName(): string {
    const names = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'];
    return names[Math.floor(Math.random() * names.length)];
  }

  extractContactInfo(content: string): string | null {
    // Look for email patterns in Twitter bio/posts
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0] : null;
  }
}