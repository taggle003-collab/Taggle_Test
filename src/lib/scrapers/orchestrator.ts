import { LLMScraper } from './llm-scraper';
import { MockScraper } from './mock-scraper';
import { BaseScraper, type ICPCriteria, type ScrapingResult } from './base-scraper';

export class LeadScrapingOrchestrator {
  private scrapers: BaseScraper[];

  constructor() {
    this.scrapers = [
      new LLMScraper(),    // Primary: Try OpenRouter
      new MockScraper()    // Fallback: Use mock if LLM fails
    ];
  }

  async scrapeLeads(
    criteria: ICPCriteria,
    limit: number = 50,
    previouslyScrapedEmails: Set<string> = new Set()
  ): Promise<ScrapingResult> {
    console.log('[ORCHESTRATOR] Starting lead scraping...');

    const effectiveCriteria = {
      ...criteria,
      desiredLeads: limit
    };

    // Try each scraper in order
    for (const scraper of this.scrapers) {
      try {
        console.log(`[ORCHESTRATOR] Trying ${scraper.constructor.name}...`);
        const result = await scraper.scrape(effectiveCriteria);

        // Filter out previously scraped emails
        const filtered = result.leads.filter(lead => !previouslyScrapedEmails.has(lead.email));

        if (filtered.length > 0) {
          console.log(`[ORCHESTRATOR] ✅ Got ${filtered.length} leads from ${scraper.constructor.name}`);
          return {
            leads: filtered.slice(0, limit),
            errors: result.errors,
            sources: [scraper.source]
          };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ORCHESTRATOR] ❌ ${scraper.constructor.name} failed: ${message}`);
        continue; // Try next scraper
      }
    }

    // If all scrapers fail, return empty
    console.log('[ORCHESTRATOR] ⚠️ All scrapers failed, returning empty');
    return {
      leads: [],
      errors: ['All scrapers failed'],
      sources: []
    };
  }

  addScraper(scraper: BaseScraper): void {
    this.scrapers.push(scraper);
  }

  getAvailableSources(): string[] {
    return this.scrapers.map(scraper => scraper.source);
  }
}

export const leadScraper = new LeadScrapingOrchestrator();
