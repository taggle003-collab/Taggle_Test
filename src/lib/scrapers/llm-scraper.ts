import { BaseScraper, type ICPCriteria, type ScrapedLead, type ScrapingResult } from './base-scraper';

export class LLMScraper extends BaseScraper {
  constructor() {
    super('https://openrouter.ai', 'llm');
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    const apiKey = process.env.LLM_API_KEY;
    
    if (!apiKey) {
      console.log('[LLM] No API key');
      return { leads: [], errors: ['No API key'], sources: [this.source] };
    }

    try {
      const start = Date.now();
      console.log('[LLM] Fetching from OpenRouter...');

      // Set 2 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [{
            role: 'user',
            content: this.buildPrompt(criteria)
          }],
          temperature: 0.7,
          max_tokens: 4000
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Only read response body ONCE
      if (!response.ok) {
        const errorMsg = `HTTP ${response.status}`;
        console.log('[LLM] API error:', errorMsg);
        return { leads: [], errors: [errorMsg], sources: [this.source] };
      }

      // Read JSON only once
      const data = await response.json() as { choices?: { message?: { content?: string } }[] };

      if (!data.choices?.[0]?.message?.content) {
        console.log('[LLM] Invalid response structure');
        return { leads: [], errors: ['Invalid response'], sources: [this.source] };
      }

      // Parse leads from response
      const leads = this.parseLeads(data.choices[0].message.content);
      
      const elapsed = Date.now() - start;
      console.log(`[LLM] Got ${leads.length} leads in ${elapsed}ms`);

      return { leads, errors: [], sources: [this.source] };

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log('[LLM] Failed:', msg);
      return { leads: [], errors: [msg], sources: [this.source] };
    }
  }

  private buildPrompt(criteria: ICPCriteria): string {
    const industry = criteria.industry || 'SaaS';
    const location = criteria.location || 'USA';
    const companySize = criteria.companySize || '10-50';
    
    return `Generate 30 B2B leads as JSON array only. No markdown, no text.
    Criteria: ${industry} in ${location}, size ${companySize}.
    
[
  {"firstName":"John","lastName":"Doe","email":"john@company.com","company":"Acme","title":"CEO","location":"USA","companySize":"50-100","industry":"SaaS","matchQualityScore":80}
]`;
  }

  private parseLeads(content: string): ScrapedLead[] {
    try {
      // Clean markdown
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Parse JSON
      const parsed = JSON.parse(clean) as Record<string, unknown> | unknown[];
      const items = Array.isArray(parsed) ? parsed : (parsed.leads as unknown[] || []);

      return (items as Record<string, string | number>[]).map((item, i: number) => ({
        id: `llm-${i}`,
        firstName: String(item.firstName || 'John'),
        lastName: String(item.lastName || 'Doe'),
        email: String(item.email || `contact${i}@company.com`),
        company: String(item.company || 'Company'),
        title: String(item.title || 'Manager'),
        location: String(item.location || 'USA'),
        companySize: String(item.companySize || '50-100'),
        industry: String(item.industry || 'SaaS'),
        matchQualityScore: Number(item.matchQualityScore || 75),
        source: 'llm' as const,
        sourceUrl: 'https://openrouter.ai'
      })).filter((l) => l.email && l.company);
    } catch (e) {
      console.log('[LLM] Parse error:', e);
      return [];
    }
  }

  generateSearchQueries(): string[] { return []; }
  async scrapePage(): Promise<Partial<ScrapedLead>[]> { return []; }
  extractContactInfo(): string | null { return null; }
}
