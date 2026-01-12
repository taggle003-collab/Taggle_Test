import { BaseScraper, ScrapedLead, ICPCriteria } from './base-scraper';

export class RedditScraper extends BaseScraper {
  constructor() {
    super('https://reddit.com', 'reddit');
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    const queries: string[] = [];
    const terms = this.generateSearchTerms(criteria);
    
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      for (const title of criteria.jobTitles) {
        queries.push(`site:reddit.com ${title} ${terms.join(' ')}`);
      }
    }
    
    // Search by industry and location
    queries.push(`site:reddit.com ${terms.join(' ')} companies`);
    queries.push(`site:reddit.com ${terms.join(' ')} startup`);
    
    // Search for specific discussions
    if (terms.length > 0) {
      queries.push(`site:reddit.com "${terms.join(' ')}" founder`);
      queries.push(`site:reddit.com "${terms.join(' ')}" ceo`);
    }
    
    return queries;
  }

  async scrapePage(query: string, page: number = 1): Promise<Partial<ScrapedLead>[]> {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${(page - 1) * 10}`;
    
    try {
      // For demo purposes, simulate scraping results
      // In production, this would make actual HTTP requests
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      
      return this.generateMockRedditResults(query);
    } catch (error) {
      console.error('Reddit scraping error:', error);
      return [];
    }
  }

  private generateMockRedditResults(query: string): Partial<ScrapedLead>[] {
    // Generate mock results that would come from Reddit
    const results: Partial<ScrapedLead>[] = [];
    const titles = ['Founder', 'CEO', 'CTO', 'VP Sales', 'Marketing Director'];
    const industries = ['SaaS', 'Tech', 'Healthcare', 'Finance', 'E-commerce'];
    
    for (let i = 0; i < 3; i++) {
      const firstName = this.getRandomName();
      const lastName = this.getRandomName();
      const company = `${this.getRandomCompany()}`;
      const title = titles[Math.floor(Math.random() * titles.length)];
      const industry = industries[Math.floor(Math.random() * industries.length)];
      
      results.push({
        firstName,
        lastName,
        company,
        title,
        industry,
        location: 'USA',
        companySize: '10-50',
        sourceUrl: `https://reddit.com/r/${industry.toLowerCase()}/comments/example${i}`,
        verified: false,
        accuracy: 75
      });
    }
    
    return results;
  }

  private getRandomName(): string {
    const names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Alex', 'Emma'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private getRandomCompany(): string {
    const companies = ['TechCorp', 'Startuply', 'InnovateCo', 'DataFlow', 'CloudScale'];
    return companies[Math.floor(Math.random() * companies.length)];
  }

  extractContactInfo(content: string): string | null {
    // Look for email patterns in Reddit posts/comments
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0] : null;
  }
}