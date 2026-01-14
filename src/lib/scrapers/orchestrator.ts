/// <reference types="node" />
/// <reference lib="es2020" />

import { KaggleAPIScraper } from './kaggle-api-scraper';
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
      // Primary lead generator (Kaggle datasets via KAGGLE_API_TOKEN)
      new KaggleAPIScraper(),

      // Optional paid fallback (LLM - OpenRouter)
      new LLMScraper(),

      // Mock fallbacks (until real scrapers are implemented)
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
        console.log(`[Orchestrator] Starting scrape with ${scraper.constructor.name}...`);
        const result = await scraper.scrape(effectiveCriteria);

        result.leads = result.leads.filter((lead) => !previouslyScrapedEmails.has(lead.email));

        console.log(`[Orchestrator] ${scraper.constructor.name} completed:`, {
          rawLeads: result.leads.length,
          afterFilter: result.leads.filter((lead) => !previouslyScrapedEmails.has(lead.email)).length,
          errors: result.errors.length,
          errorDetails: result.errors.slice(0, 3)
        });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[Orchestrator] Error with ${scraper.constructor.name}:`, error);

        return {
          leads: [],
          errors: [`${scraper.constructor.name}: ${message}`],
          sources: [scraper.source]
        };
      }
    };

    // Run primary scraper first so users get real leads from Kaggle datasets.
    const primaryResult = await runScraper(primaryScraper);
    allResults.leads.push(...primaryResult.leads);
    allResults.errors.push(...primaryResult.errors);
    allResults.sources.push(...primaryResult.sources);

    console.log(`[Orchestrator] Primary scraper (${primaryScraper.constructor.name}) results:`, {
      leadsFound: primaryResult.leads.length,
      errors: primaryResult.errors.length,
      errorDetails: primaryResult.errors.slice(0, 5),
      sources: primaryResult.sources
    });

    let uniqueCount = this.removeDuplicates(allResults.leads).length;

    const llmConfigured = !!process.env.LLM_API_KEY;
    const allowMockFallback =
      process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_FALLBACK === "true";

    // Try LLM as an optional non-mock fallback when it's configured.
    const llmScraper = fallbackScrapers.find((scraper) => scraper.source === "llm");

    if (uniqueCount < limit && llmConfigured && llmScraper) {
      console.log(
        `[Orchestrator] Primary returned ${uniqueCount}/${limit} unique leads. Running LLM fallback... (llmConfigured=${llmConfigured})`
      );

      const llmResult = await runScraper(llmScraper);
      allResults.leads.push(...llmResult.leads);
      allResults.errors.push(...llmResult.errors);
      allResults.sources.push(...llmResult.sources);

      console.log(`[Orchestrator] LLM scraper results:`, {
        leadsFound: llmResult.leads.length,
        errors: llmResult.errors.length,
        errorDetails: llmResult.errors.slice(0, 3)
      });

      uniqueCount = this.removeDuplicates(allResults.leads).length;
    }

    // If still short, optionally fall back to mock scrapers (disabled by default in production).
    const mockFallbackScrapers = fallbackScrapers.filter((scraper) => scraper !== llmScraper);
    const shouldRunMockFallback = uniqueCount < limit && allowMockFallback;

    if (!shouldRunMockFallback && uniqueCount < limit) {
      console.log(
        `[Orchestrator] Returning ${uniqueCount}/${limit} unique leads. Skipping mock fallback scrapers (llmConfigured=${llmConfigured}, allowMockFallback=${allowMockFallback}).`
      );
    }

    if (shouldRunMockFallback && mockFallbackScrapers.length > 0) {
      console.log(
        `[Orchestrator] Returning ${uniqueCount}/${limit} unique leads. Running ${mockFallbackScrapers.length} mock fallback scrapers... (llmConfigured=${llmConfigured}, allowMockFallback=${allowMockFallback})`
      );

      const results = await Promise.allSettled(mockFallbackScrapers.map((scraper) => runScraper(scraper)));

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const scraperResult = result.value;
          allResults.leads.push(...scraperResult.leads);
          allResults.errors.push(...scraperResult.errors);
          allResults.sources.push(...scraperResult.sources);
          console.log(`[Orchestrator] Mock scraper ${mockFallbackScrapers[index].constructor.name}:`, {
            leadsFound: scraperResult.leads.length,
            errors: scraperResult.errors.length
          });
        } else {
          allResults.errors.push(`${mockFallbackScrapers[index].constructor.name}: ${result.reason}`);
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
      `[Orchestrator] Scraping complete. Found ${limitedLeads.length} unique leads from ${uniqueSources.length} sources.`
    );
    console.log(`[Orchestrator] Errors (${allResults.errors.length}):`, allResults.errors.length > 0 ? allResults.errors.slice(0, 10) : 'none');

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