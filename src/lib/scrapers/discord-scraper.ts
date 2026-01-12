import { BaseScraper, ScrapedLead, ICPCriteria } from './base-scraper';

export class DiscordScraper extends BaseScraper {
  constructor() {
    super('https://discord.com', 'discord');
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    const queries: string[] = [];
    const terms = this.generateSearchTerms(criteria);
    
    // Discord server searches via Google
    if (criteria.industry) {
      queries.push(`site:discord.com ${criteria.industry} server`);
      queries.push(`site:discord.com ${criteria.industry} community`);
    }
    
    // Job title searches
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      for (const title of criteria.jobTitles) {
        queries.push(`site:discord.com ${title} ${terms.join(' ')}`);
      }
    }
    
    // Custom ICP searches
    if (criteria.customICP) {
      queries.push(`site:discord.com "${criteria.customICP}" server`);
      queries.push(`site:discord.com "${criteria.customICP}" community`);
    }
    
    return queries;
  }

  async scrapePage(query: string, page: number = 1): Promise<Partial<ScrapedLead>[]> {
    try {
      // Simulate Discord scraping delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return this.generateMockDiscordResults(query);
    } catch (error) {
      console.error('Discord scraping error:', error);
      return [];
    }
  }

  private generateMockDiscordResults(query: string): Partial<ScrapedLead>[] {
    const results: Partial<ScrapedLead>[] = [];
    const companies = ['DevCommunity', 'TechGuild', 'StartupHub', 'InnovateSpace', 'CodeCollective'];
    const titles = ['Moderator', 'Community Manager', 'Developer', 'Founder', 'Admin'];
    const industries = ['Gaming', 'Tech', 'Development', 'Startup', 'Community'];
    const locations = ['Global', 'USA', 'Europe', 'Remote', 'Online'];
    
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
        companySize: '100-500',
        sourceUrl: `https://discord.com/channels/@me/${Math.random().toString(36).substr(2, 18)}`,
        verified: false,
        accuracy: 70,
        linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-discord`
      });
    }
    
    return results;
  }

  private getRandomName(): string {
    const names = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery', 'Quinn'];
    return names[Math.floor(Math.random() * names.length)];
  }

  extractContactInfo(content: string): string | null {
    // Discord users rarely share emails directly, but might have contact info in status
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0] : null;
  }
}