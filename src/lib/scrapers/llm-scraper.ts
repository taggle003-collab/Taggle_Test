import { BaseScraper, type ICPCriteria, type ScrapedLead, type ScrapingResult } from './base-scraper';

interface RawLLMLead {
  firstName?: string;
  lastName?: string;
  email: string;
  company: string;
  title?: string;
  location?: string;
  companySize?: string;
  industry?: string;
  linkedInProfile?: string;
  matchQualityScore?: number;
}

export class LLMScraper extends BaseScraper {
  constructor() {
    super('https://openrouter.ai', 'llm');
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    const apiKey = process.env.LLM_API_KEY;
    
    if (!apiKey) {
      console.log('[LLM_SCRAPER] API key not configured, skipping');
      return { leads: [], errors: ['No LLM_API_KEY configured'], sources: [this.source] };
    }

    const desired = Math.max(1, Math.min(criteria.desiredLeads ?? 50, 100));
    const prompt = this.buildPrompt(criteria, desired);

    try {
      console.log('[LLM_SCRAPER] Starting API call to OpenRouter...');
      const startTime = Date.now();

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://taggle.co.in',
          'X-Title': 'Taggle'
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL_NAME || 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 8000
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
      const elapsed = Date.now() - startTime;
      console.log(`[LLM_SCRAPER] API response received in ${elapsed}ms`);

      if (!response.ok) {
        const errorText = await response.text(); // Read once
        console.error('[LLM_SCRAPER] API error:', {
          status: response.status,
          message: errorText.slice(0, 200)
        });
        
        return {
          leads: [],
          errors: [`OpenRouter API error: ${response.status}`],
          sources: [this.source]
        };
      }

      // Parse response ONCE
      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[LLM_SCRAPER] Invalid response structure');
        return {
          leads: [],
          errors: ['Invalid OpenRouter response'],
          sources: [this.source]
        };
      }

      const content = data.choices[0].message.content;
      const leads = this.parseLeads(content, criteria);

      console.log(`[LLM_SCRAPER] Generated ${leads.length} leads`);
      
      return {
        leads,
        errors: [],
        sources: [this.source]
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('AbortError') || message.includes('timeout')) {
        console.log('[LLM_SCRAPER] Timeout - API took too long');
      } else {
        console.error('[LLM_SCRAPER] Error:', message);
      }

      return {
        leads: [],
        errors: [`LLM Error: ${message}`],
        sources: [this.source]
      };
    }
  }

  private buildPrompt(criteria: ICPCriteria, desired: number): string {
    const filters = [];
    if (criteria.industry) filters.push(`Industry: ${criteria.industry}`);
    if (criteria.location) filters.push(`Location: ${criteria.location}`);
    if (criteria.companySize) filters.push(`Company Size: ${criteria.companySize}`);
    
    return `Generate exactly ${desired} realistic B2B sales leads in strict JSON format. 
Filters: ${filters.join(', ') || 'Any'}

CRITICAL: Return ONLY valid JSON array, no markdown, no extra text.

Format: [
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "company": "Acme Corp",
    "title": "CEO",
    "location": "San Francisco, USA",
    "companySize": "50-100",
    "industry": "SaaS",
    "matchQualityScore": 85,
    "linkedInProfile": "https://linkedin.com/in/johndoe"
  }
]

Ensure:
- All emails are unique and realistic
- No @example.com or @test.com domains
- Titles are realistic
- No fake data`;
  }

  private parseLeads(content: string, criteria: ICPCriteria): ScrapedLead[] {
    try {
      // Remove markdown code blocks if present
      let cleaned = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');

      // Parse JSON
      const parsed = JSON.parse(cleaned);
      const items = (Array.isArray(parsed) ? parsed : parsed.leads || []) as RawLLMLead[];

      const leads: ScrapedLead[] = items
        .filter((item) => item.email && item.company)
        .map((item, idx: number) => ({
          id: `llm-${Date.now()}-${idx}`,
          firstName: item.firstName || 'Unknown',
          lastName: item.lastName || 'Lead',
          email: item.email,
          company: item.company,
          title: item.title || 'Manager',
          location: item.location || 'Unknown',
          companySize: item.companySize || 'Unknown',
          industry: item.industry || criteria.industry || 'Unknown',
          linkedInProfile: item.linkedInProfile,
          matchQualityScore: item.matchQualityScore || 75,
          isMockData: false,
          source: 'llm'
        }));

      return leads;
    } catch (error) {
      console.error('[LLM_SCRAPER] Parse error:', error);
      return [];
    }
  }

  generateSearchQueries(_criteria: ICPCriteria): string[] {
    return [];
  }

  async scrapePage(_query: string): Promise<Partial<ScrapedLead>[]> {
    return [];
  }

  extractContactInfo(_content: string): string | null {
    return null;
  }
}
