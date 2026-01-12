import { RedditScraper } from './reddit-scraper';
import { GoogleSearchScraper } from './google-scraper';
import { TwitterScraper } from './twitter-scraper';
import { YouTubeScraper } from './youtube-scraper';
import { DiscordScraper } from './discord-scraper';
import { BaseScraper } from './base-scraper';
import { ScrapedLead, ICPCriteria, ScrapingResult } from './base-scraper';

export class LeadScrapingOrchestrator {
  private scrapers: BaseScraper[];

  constructor() {
    this.scrapers = [
      new RedditScraper(),
      new GoogleSearchScraper(),
      new TwitterScraper(),
      new YouTubeScraper(),
      new DiscordScraper(),
      // Add other scrapers as they're implemented
      // new InstagramScraper(),
      // new FacebookScraper(),
    ];
  }

  async scrapeLeads(
    criteria: ICPCriteria, 
    limit: number = 50,
    previouslyScrapedEmails: Set<string> = new Set(),
    isAdvancedMatching: boolean = false
  ): Promise<ScrapingResult> {
    console.log(`Starting lead scraping for criteria:`, criteria);
    
    const allResults: ScrapingResult = {
      leads: [],
      errors: [],
      sources: []
    };

    // Run all scrapers in parallel
    const scrapingPromises = this.scrapers.map(async (scraper) => {
      try {
        console.log(`Scraping with ${scraper.constructor.name}...`);
        const result = await scraper.scrape(criteria);
        
        // Filter out already scraped emails
        result.leads = result.leads.filter(lead => 
          !previouslyScrapedEmails.has(lead.email)
        );
        
        return result;
      } catch (error) {
        console.error(`Error with ${scraper.constructor.name}:`, error);
        allResults.errors.push(
          `${scraper.constructor.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return { leads: [], errors: [], sources: [scraper.source] };
      }
    });

    const results = await Promise.allSettled(scrapingPromises);

    // Merge all results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const scraperResult = result.value;
        allResults.leads.push(...scraperResult.leads);
        allResults.errors.push(...scraperResult.errors);
        allResults.sources.push(...scraperResult.sources);
      } else {
        allResults.errors.push(
          `${this.scrapers[index].constructor.name}: ${result.reason}`
        );
      }
    });

    // Remove duplicates and sort by match score
    const uniqueLeads = this.removeDuplicates(allResults.leads);
    uniqueLeads.sort((a, b) => (b.matchQualityScore || 0) - (a.matchQualityScore || 0));

    // Apply limit
    const limitedLeads = uniqueLeads.slice(0, limit);

    console.log(`Scraping complete. Found ${limitedLeads.length} unique leads from ${allResults.sources.length} sources.`);
    console.log(`Errors: ${allResults.errors.length}`);

    return {
      leads: limitedLeads,
      errors: allResults.errors,
      sources: [...new Set(allResults.sources)]
    };
  }

  private removeDuplicates(leads: ScrapedLead[]): ScrapedLead[] {
    const seen = new Set<string>();
    const unique: ScrapedLead[] = [];

    for (const lead of leads) {
      // Create a key based on name + company + email
      const key = `${lead.firstName}-${lead.lastName}-${lead.company}-${lead.email}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }

    return unique;
  }

  // Helper method to validate email format
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidPatterns = [
      'noreply', 'no-reply', 'donotreply', 'test', 'example', 
      'spam', 'fake', 'dummy', 'admin@', 'info@'
    ];
    
    if (!emailRegex.test(email)) return false;
    
    const lowerEmail = email.toLowerCase();
    return !invalidPatterns.some(pattern => lowerEmail.includes(pattern));
  }

  // Add a scraper dynamically
  addScraper(scraper: BaseScraper): void {
    this.scrapers.push(scraper);
  }

  // Get available sources
  getAvailableSources(): string[] {
    return this.scrapers.map(scraper => scraper.source);
  }
}

// Export a singleton instance
export const leadScraper = new LeadScrapingOrchestrator();