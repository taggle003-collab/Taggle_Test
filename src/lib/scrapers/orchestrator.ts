import { LLMScraper } from "./llm-scraper";
import { MockScraper } from "./mock-scraper";
import { type ICPCriteria, type ScrapingResult } from "./base-scraper";

export class ScraperOrchestrator {
  private scrapers: (LLMScraper | MockScraper)[];

  constructor() {
    this.scrapers = [
      new LLMScraper(),
      new MockScraper()
    ];
  }

  async scrapeLeads(criteria: ICPCriteria): Promise<ScrapingResult & { isReal: boolean }> {
    const llmScraper = this.scrapers[0] as LLMScraper;
    const mockScraper = this.scrapers[1] as MockScraper;

    try {
      console.log("[Orchestrator] Attempting LLM Scraping...");
      const result = await llmScraper.scrape(criteria);
      if (result.leads.length > 0) {
        return { ...result, isReal: true };
      }
      throw new Error("LLM returned no leads");
    } catch (error) {
      console.error("[Orchestrator] LLM Scraping failed, falling back to Mock:", error);
      const result = await mockScraper.scrape(criteria);
      return { ...result, isReal: false };
    }
  }
}
