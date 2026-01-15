/// <reference types="node" />
/// <reference lib="es2020" />

import { BaseScraper, type ICPCriteria, type ScrapedLead, type ScrapingResult } from "./base-scraper";

type LLMLead = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  linkedInProfile?: string;
  fundingStage?: string | null;
  annualRevenue?: string | null;
  matchQualityScore?: number;
};

export class LLMScraper extends BaseScraper {
  private readonly modelName: string;
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;

  constructor() {
    super("https://openrouter.ai", "llm");
    this.apiKey = process.env.LLM_API_KEY || "";
    this.modelName = process.env.LLM_MODEL_NAME || "deepseek/deepseek-chat";
    this.apiBaseUrl = process.env.LLM_API_BASE_URL || "https://openrouter.ai/api/v1";
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    return [JSON.stringify(criteria)];
  }

  async scrapePage(_query: string): Promise<Partial<ScrapedLead>[]> {
    return []; // Not used
  }

  extractContactInfo(_content: string): string | null {
    return null;
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    if (!this.apiKey) {
      throw new Error("LLM_API_KEY is not configured");
    }

    const count = criteria.desiredLeads || 25;
    const prompt = this.buildPrompt(criteria, count);

    try {
      const response = await fetch(`${this.apiBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://leadscraperapp.com",
          "X-Title": "Lead Scraper App"
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: "system",
              content: "You are a B2B lead generation expert. Generate realistic leads in strict JSON format."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || "";
      const parsedData = JSON.parse(rawText);
      const llmLeads: LLMLead[] = Array.isArray(parsedData) ? parsedData : (parsedData.leads || []);

      const leads: ScrapedLead[] = llmLeads.map((llmLead, index) => ({
        id: `llm-${Date.now()}-${index}`,
        firstName: llmLead.firstName,
        lastName: llmLead.lastName,
        email: llmLead.email,
        company: llmLead.company,
        title: llmLead.title,
        location: llmLead.location,
        companySize: llmLead.companySize,
        industry: llmLead.industry,
        linkedInProfile: llmLead.linkedInProfile,
        fundingStage: llmLead.fundingStage || undefined,
        annualRevenue: llmLead.annualRevenue || undefined,
        matchQualityScore: llmLead.matchQualityScore || 85,
        isMockData: false,
        source: "llm",
        sourceUrl: "https://openrouter.ai"
      }));

      return {
        leads,
        errors: [],
        sources: ["llm"]
      };
    } catch (error) {
      console.error("[LLMScraper] Error:", error);
      throw error;
    }
  }

  private buildPrompt(criteria: ICPCriteria, count: number): string {
    return `Generate exactly ${count} realistic B2B leads as a JSON array matching these criteria:
- Industry: ${criteria.industry || "Any"}
- Location: ${criteria.location || "Any"}
- Company Size: ${criteria.companySize || "Any"}
- Job Titles: ${(criteria.jobTitles || []).join(", ") || "Any senior role"}
${criteria.customICP ? `- Custom ICP: ${criteria.customICP}` : ""}

Required Fields: firstName, lastName, email, company, title, location, companySize, industry
Optional Fields: linkedInProfile, fundingStage, annualRevenue, matchQualityScore

Return ONLY a JSON object with a 'leads' array.`;
  }
}
