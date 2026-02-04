import { BaseScraper, ScrapedLead, ICPCriteria } from './base-scraper';

export class YouTubeScraper extends BaseScraper {
  constructor() {
    super('https://youtube.com', 'youtube');
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    const queries: string[] = [];
    const terms = this.generateSearchTerms(criteria);
    
    // YouTube channel searches
    if (criteria.industry) {
      queries.push(`site:youtube.com ${criteria.industry} channel`);
      queries.push(`site:youtube.com ${criteria.industry} interview`);
    }
    
    // Job title searches
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      for (const title of criteria.jobTitles) {
        queries.push(`site:youtube.com "${title}" interview`);
        queries.push(`site:youtube.com ${title} podcast`);
      }
    }
    
    // Custom ICP searches
    if (criteria.customICP) {
      queries.push(`site:youtube.com "${criteria.customICP}"`);
      queries.push(`site:youtube.com "${criteria.customICP}" interview`);
    }
    
    return queries;
  }

  async scrapePage(query: string, page: number = 1): Promise<Partial<ScrapedLead>[]> {
    try {
      // Simulate YouTube scraping delay (longer due to video content)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return this.generateMockYouTubeResults(query);
    } catch (error) {
      console.error('YouTube scraping error:', error);
      return [];
    }
  }

  private generateMockYouTubeResults(query: string): Partial<ScrapedLead>[] {
    const results: Partial<ScrapedLead>[] = [];
    const companies = ['VideoTech', 'MediaFlow', 'StreamCorp', 'ContentHub', 'CreatorStudio'];
    const titles = ['CEO', 'Founder', 'Content Director', 'Creative Lead', 'Channel Owner'];
    const industries = ['Media', 'Entertainment', 'SaaS', 'Tech', 'Education'];
    const locations = ['Los Angeles, CA', 'New York, NY', 'San Francisco, CA', 'Nashville, TN', 'Austin, TX'];
    
    for (let i = 0; i < 3; i++) {
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
        companySize: '5-20',
        sourceUrl: `https://youtube.com/channel/UC${Math.random().toString(36).substr(2, 22)}`,
        verified: false,
        accuracy: 70,
        linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-content`
      });
    }
    
    return results;
  }

  private getRandomName(): string {
    const names = ['Casey', 'Jamie', 'Robin', 'Sam', 'Chris', 'Pat', 'Drew', 'Sky'];
    return names[Math.floor(Math.random() * names.length)];
  }

  extractContactInfo(content: string): string | null {
    // Look for contact info in YouTube video descriptions
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0] : null;
  }
}