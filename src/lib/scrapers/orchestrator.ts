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
      // Primary lead generator (LLM - OpenRouter) - most reliable, generates valid leads consistently
      new LLMScraper(),

      // Fallback lead generator (Kaggle datasets via KAGGLE_API_TOKEN)
      new KaggleAPIScraper(),

      // Mock fallbacks (only in development or when ALLOW_MOCK_FALLBACK=true)
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

    console.log(`[Orchestrator] Starting lead scraping for criteria:`, {
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

    const runScraper = async (scraper: BaseScraper, retries: number = 3): Promise<ScrapingResult> => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[Orchestrator] Attempt ${attempt}/${retries}: Scraping with ${scraper.constructor.name}...`);
          const startTime = Date.now();
          const result = await scraper.scrape(effectiveCriteria);
          const duration = Date.now() - startTime;

          result.leads = result.leads.filter((lead) => !previouslyScrapedEmails.has(lead.email));

          console.log(
            `[Orchestrator] ${scraper.constructor.name} succeeded in ${duration}ms: ${result.leads.length} leads, ${result.errors.length} errors`
          );

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.error(`[Orchestrator] ${scraper.constructor.name} attempt ${attempt}/${retries} failed:`, lastError.message);

          if (attempt < retries) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`[Orchestrator] Retrying ${scraper.constructor.name} in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }

      console.error(`[Orchestrator] ${scraper.constructor.name} failed after ${retries} attempts:`, lastError);
      return {
        leads: [],
        errors: [`${scraper.constructor.name}: ${lastError?.message || "Unknown error"}`],
        sources: [scraper.source]
      };
    };

    // Run LLM scraper first (primary) - most reliable for generating valid leads
    console.log(`[Orchestrator] Running primary scraper: ${primaryScraper.constructor.name}`);
    const primaryResult = await runScraper(primaryScraper, 2); // 2 retries for primary
    allResults.leads.push(...primaryResult.leads);
    allResults.errors.push(...primaryResult.errors);
    allResults.sources.push(...primaryResult.sources);

    let uniqueCount = this.removeDuplicates(allResults.leads).length;
    console.log(`[Orchestrator] Primary scraper returned ${primaryResult.leads.length} leads (${uniqueCount} unique)`);

    // Check configuration for fallback scrapers
    const kaggleConfigured = !!process.env.KAGGLE_API_TOKEN;
    const allowMockFallback =
      process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_FALLBACK === "true";

    // Try Kaggle scraper as fallback if LLM didn't return enough leads
    const kaggleScraper = fallbackScrapers.find((scraper) => scraper.source === "kaggle");

    if (uniqueCount < limit && kaggleConfigured && kaggleScraper) {
      console.log(
        `[Orchestrator] Primary returned ${uniqueCount}/${limit} unique leads. Running Kaggle fallback... (kaggleConfigured=${kaggleConfigured})`
      );

      const kaggleResult = await runScraper(kaggleScraper, 1); // 1 retry for Kaggle
      allResults.leads.push(...kaggleResult.leads);
      allResults.errors.push(...kaggleResult.errors);
      allResults.sources.push(...kaggleResult.sources);

      uniqueCount = this.removeDuplicates(allResults.leads).length;
      console.log(`[Orchestrator] After Kaggle: ${uniqueCount}/${limit} unique leads`);
    }

    // If still short, optionally fall back to mock scrapers (disabled by default in production).
    const mockFallbackScrapers = fallbackScrapers.filter((scraper) => scraper !== kaggleScraper);
    const shouldRunMockFallback = uniqueCount < limit && allowMockFallback;

    if (!shouldRunMockFallback && uniqueCount < limit) {
      console.log(
        `[Orchestrator] Returning ${uniqueCount}/${limit} unique leads. Skipping mock fallback scrapers (allowMockFallback=${allowMockFallback}).`
      );
    }

    if (shouldRunMockFallback && mockFallbackScrapers.length > 0) {
      console.log(
        `[Orchestrator] Returning ${uniqueCount}/${limit} unique leads. Running ${mockFallbackScrapers.length} mock fallback scrapers... (allowMockFallback=${allowMockFallback})`
      );

      const results = await Promise.allSettled(mockFallbackScrapers.map((scraper) => runScraper(scraper, 0))); // No retries for mocks

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const scraperResult = result.value;
          allResults.leads.push(...scraperResult.leads);
          allResults.errors.push(...scraperResult.errors);
          allResults.sources.push(...scraperResult.sources);
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
      `[Orchestrator] Scraping complete. Found ${limitedLeads.length} unique leads from ${uniqueSources.length} sources: ${uniqueSources.join(", ")}`
    );
    console.log(`[Orchestrator] Errors: ${allResults.errors.length}`, allResults.errors.slice(0, 3));

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