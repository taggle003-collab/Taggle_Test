import { LLMScraper } from './llm-scraper';
import { RedditScraper } from './reddit-scraper';
import { GoogleSearchScraper } from './google-scraper';
import { TwitterScraper } from './twitter-scraper';
import { YouTubeScraper } from './youtube-scraper';
import { DiscordScraper } from './discord-scraper';
import { BaseScraper, type ScrapedLead, type ICPCriteria, type ScrapingResult } from './base-scraper';

export class LeadScrapingOrchestrator {
  private scrapers: BaseScraper[];

  constructor() {
    this.scrapers = [
      // Primary lead generator (LLM - DeepSeek-V3)
      new LLMScraper(),

      // Fallback scrapers (mock data until real scrapers are implemented)
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
    const effectiveCriteria: ICPCriteria = {
      ...criteria,
      desiredLeads: limit,
      isAdvancedMatching
    };

    console.log(`Starting lead scraping for criteria:`, {
      ...criteria,
      desiredLeads: limit,
      isAdvancedMatching
    });

    const allResults: ScrapingResult = {
      leads: [],
      errors: [],
      sources: []
    };

    const [primaryScraper, ...fallbackScrapers] = this.scrapers;

    const runScraper = async (scraper: BaseScraper): Promise<ScrapingResult> => {
      try {
        console.log(`Scraping with ${scraper.constructor.name}...`);
        const result = await scraper.scrape(effectiveCriteria);

        result.leads = result.leads.filter((lead) => !previouslyScrapedEmails.has(lead.email));

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error with ${scraper.constructor.name}:`, error);

        return {
          leads: [],
          errors: [`${scraper.constructor.name}: ${message}`],
          sources: [scraper.source]
        };
      }
    };

    // Run LLM scraper first so users get real leads as the primary source.
    const primaryResult = await runScraper(primaryScraper);
    allResults.leads.push(...primaryResult.leads);
    allResults.errors.push(...primaryResult.errors);
    allResults.sources.push(...primaryResult.sources);

    // If LLM scraper failed or didn't return enough leads, fall back to the mock scrapers.
    const primaryUniqueCount = this.removeDuplicates(allResults.leads).length;
    const shouldRunFallback = primaryUniqueCount < limit;

    if (shouldRunFallback && fallbackScrapers.length > 0) {
      console.log(
        `[Orchestrator] Primary returned ${primaryUniqueCount}/${limit} unique leads. Running ${fallbackScrapers.length} fallback scrapers...`
      );

      const results = await Promise.allSettled(fallbackScrapers.map((scraper) => runScraper(scraper)));

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const scraperResult = result.value;
          allResults.leads.push(...scraperResult.leads);
          allResults.errors.push(...scraperResult.errors);
          allResults.sources.push(...scraperResult.sources);
        } else {
          allResults.errors.push(`${fallbackScrapers[index].constructor.name}: ${result.reason}`);
        }
      });
    }

    // Remove duplicates and sort by match score
    const uniqueLeads = this.removeDuplicates(allResults.leads);
    uniqueLeads.sort((a, b) => (b.matchQualityScore || 0) - (a.matchQualityScore || 0));

    // Apply limit
    const limitedLeads = uniqueLeads.slice(0, limit);

    const uniqueSources = allResults.sources.filter((source, index, arr) => arr.indexOf(source) === index);

    console.log(
      `Scraping complete. Found ${limitedLeads.length} unique leads from ${uniqueSources.length} sources.`
    );
    console.log(`Errors: ${allResults.errors.length}`);

    return {
      leads: limitedLeads,
      errors: allResults.errors,
      sources: uniqueSources
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