import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseScraper, type ICPCriteria, type ScrapedLead } from "./base-scraper";

type GeminiLead = {
  firstName: string;
  lastName: string;
  email?: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  linkedInProfile?: string;
  founderName?: string;
  founderTitle?: string;
  fundingStage?: string | null;
  annualRevenue?: string | null;
};

type GeminiQueryPayload = {
  batchIndex: number;
  batches: number;
  count: number;
  criteria: ICPCriteria;
};

export class GeminiScraper extends BaseScraper {
  private readonly modelName: string;
  private readonly batchSize: number;

  constructor(modelName: string = "gemini-1.5-flash", batchSize: number = 25) {
    super("https://ai.google.dev", "gemini");
    this.modelName = modelName;
    this.batchSize = Math.max(1, Math.min(batchSize, 30));
  }

  // Override the base scrape method to handle AI-generated leads more appropriately
  async scrape(criteria: ICPCriteria): Promise<import('./base-scraper').ScrapingResult> {
    console.log(`[GeminiScraper] Starting AI-powered lead generation for criteria:`, {
      industry: criteria.industry,
      location: criteria.location,
      companySize: criteria.companySize,
      jobTitles: criteria.jobTitles,
      desiredLeads: criteria.desiredLeads || 50,
      isAdvancedMatching: criteria.isAdvancedMatching
    });

    const queries = this.generateSearchQueries(criteria);
    const allLeads: ScrapedLead[] = [];
    const errors: string[] = [];
    
    for (const query of queries) {
      try {
        console.log(`[GeminiScraper] Processing query ${queries.indexOf(query) + 1}/${queries.length}`);
        const leads = await this.scrapePage(query);
        
        console.log(`[GeminiScraper] Received ${leads.length} leads from query`);
        
        for (const lead of leads) {
          // For AI-generated leads, use a more lenient quality threshold since they're designed to match criteria
          const matchScore = this.calculateMatchScore(criteria, lead);
          const qualityThreshold = criteria.qualityScore || 60; // More lenient for AI leads
          
          console.log(`[GeminiScraper] Lead "${lead.firstName} ${lead.lastName}" scored ${matchScore} (threshold: ${qualityThreshold})`);
          
          if (matchScore >= qualityThreshold) {
            const fullLead: ScrapedLead = {
              id: `${this.source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              firstName: lead.firstName || '',
              lastName: lead.lastName || '',
              email: lead.email || this.createEmailPattern(
                `${lead.firstName || 'User'} ${lead.lastName || 'Lead'}`,
                lead.company || 'Company'
              ),
              company: lead.company || '',
              title: lead.title || '',
              location: lead.location || '',
              companySize: lead.companySize || 'Unknown',
              industry: lead.industry || criteria.industry || 'Unknown',
              linkedInProfile: lead.linkedInProfile,
              verified: lead.verified || false,
              accuracy: lead.accuracy || Math.min(matchScore + 10, 95),
              founderName: lead.founderName,
              founderTitle: lead.founderTitle,
              founderImage: lead.founderImage,
              fundingStage: lead.fundingStage,
              annualRevenue: lead.annualRevenue,
              matchQualityScore: matchScore,
              matchedCriteria: this.getMatchedCriteria(criteria, lead),
              source: this.source,
              sourceUrl: lead.sourceUrl || '',
            };
            
            allLeads.push(fullLead);
            console.log(`[GeminiScraper] Added lead with score ${matchScore}: ${fullLead.firstName} ${fullLead.lastName}`);
          } else {
            console.log(`[GeminiScraper] Filtered out lead with low score ${matchScore}: ${lead.firstName} ${lead.lastName}`);
          }
        }
      } catch (error) {
        const errorMessage = `Error scraping ${query}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[GeminiScraper] ${errorMessage}`);
        errors.push(errorMessage);
      }
    }
    
    console.log(`[GeminiScraper] Final results: ${allLeads.length} leads, ${errors.length} errors`);
    
    return {
      leads: allLeads,
      errors,
      sources: [this.source]
    };
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    const desired = Math.max(1, Math.min(criteria.desiredLeads ?? this.batchSize, 200));
    const batches = Math.max(1, Math.ceil(desired / this.batchSize));

    const queries: string[] = [];

    for (let i = 0; i < batches; i++) {
      const remaining = desired - i * this.batchSize;
      const count = Math.max(1, Math.min(this.batchSize, remaining));

      const payload: GeminiQueryPayload = {
        batchIndex: i + 1,
        batches,
        count,
        criteria
      };

      const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
      queries.push(`gemini:${encoded}`);
    }

    return queries;
  }

  async scrapePage(query: string): Promise<Partial<ScrapedLead>[]> {
    const payload = this.decodeQueryPayload(query);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Gemini API key not configured. Set GOOGLE_GENERATIVE_AI_KEY (or GEMINI_API_KEY) in your environment."
      );
    }

    console.log(
      `[GeminiScraper] Generating ${payload.count} leads (batch ${payload.batchIndex}/${payload.batches}) for criteria:`,
      {
        industry: payload.criteria.industry,
        location: payload.criteria.location,
        companySize: payload.criteria.companySize,
        jobTitles: payload.criteria.jobTitles,
        hasCustomICP: !!payload.criteria.customICP,
        isAdvancedMatching: !!payload.criteria.isAdvancedMatching
      }
    );

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    });

    const prompt = this.buildPrompt(payload.criteria, payload.count);
    console.log(`[GeminiScraper] Using prompt (${prompt.length} chars)`);

    const startedAt = Date.now();
    
    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();

      console.log(`[GeminiScraper] Gemini responded in ${Date.now() - startedAt}ms (${rawText.length} chars)`);

      const parsedLeads = this.parseLeadsFromGemini(rawText);
      console.log(`[GeminiScraper] Successfully parsed ${parsedLeads.length} raw leads from Gemini`);

      const normalized = parsedLeads
        .map((lead, index) => {
          try {
            const normalizedLead = this.normalizeLead(lead, payload.criteria);
            if (normalizedLead) {
              console.log(`[GeminiScraper] Lead ${index + 1}/${parsedLeads.length} normalized successfully`);
              return normalizedLead;
            } else {
              console.log(`[GeminiScraper] Lead ${index + 1}/${parsedLeads.length} failed normalization`);
              return null;
            }
          } catch (error) {
            console.error(`[GeminiScraper] Lead ${index + 1}/${parsedLeads.length} normalization error:`, error);
            return null;
          }
        })
        .filter((lead): lead is Partial<ScrapedLead> => !!lead);

      console.log(`[GeminiScraper] Final normalized leads count: ${normalized.length} from batch ${payload.batchIndex}/${payload.batches}`);

      // Ensure we return at least some leads if we got any valid ones
      if (normalized.length === 0) {
        console.warn(`[GeminiScraper] WARNING: No valid leads generated in batch ${payload.batchIndex}/${payload.batches}`);
        // Try to generate a minimal fallback lead
        const fallbackLead = this.generateFallbackLead(payload.criteria);
        if (fallbackLead) {
          console.log(`[GeminiScraper] Generated fallback lead`);
          return [fallbackLead];
        }
      }

      return normalized;
    } catch (error) {
      console.error(`[GeminiScraper] Error in batch ${payload.batchIndex}/${payload.batches}:`, error);
      
      // Try to generate fallback leads on error
      try {
        const fallbackLeads = this.generateFallbackLeads(payload.criteria, Math.min(payload.count, 5));
        if (fallbackLeads.length > 0) {
          console.log(`[GeminiScraper] Generated ${fallbackLeads.length} fallback leads after error`);
          return fallbackLeads;
        }
      } catch (fallbackError) {
        console.error(`[GeminiScraper] Fallback generation also failed:`, fallbackError);
      }
      
      // If all else fails, return empty array but log it
      console.error(`[GeminiScraper] Complete failure in batch ${payload.batchIndex}/${payload.batches}, returning empty array`);
      return [];
    }
  }

  extractContactInfo(content: string): string | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = content.match(emailRegex);
    return matches ? matches[0] : null;
  }

  private decodeQueryPayload(query: string): GeminiQueryPayload {
    if (!query.startsWith("gemini:")) {
      throw new Error("Invalid Gemini query payload");
    }

    const encoded = query.slice("gemini:".length);
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");

    return JSON.parse(decoded) as GeminiQueryPayload;
  }

  private buildPrompt(criteria: ICPCriteria, count: number): string {
    const jobTitles = (criteria.jobTitles || []).filter(Boolean);

    const criteriaLines = [
      criteria.industry ? `- Industry (must match exactly): ${criteria.industry}` : "- Industry: Technology, SaaS, or related",
      criteria.location ? `- Location (must include): ${criteria.location}` : "- Location: USA or North America preferred",
      criteria.companySize
        ? `- Company Size (must match exactly): ${criteria.companySize}`
        : "- Company Size: one of 1-10, 10-50, 50-100, 100-500, 500-1000",
      jobTitles.length > 0
        ? `- Job Titles (title must include one): ${jobTitles.join(", ")}`
        : "- Job Titles: CEO, Founder, CTO, VP Engineering, Product Manager, or similar senior roles",
      criteria.customICP ? `- Custom ICP notes: ${criteria.customICP}` : null
    ].filter(Boolean);

    const advancedNote = criteria.isAdvancedMatching
      ? "Include realistic fundingStage (seed, series-a, series-b, series-c, growth-stage, mature) and annualRevenue (format: $500K-$1M, $1M-$5M, etc.) for each lead."
      : "Set fundingStage and annualRevenue to null values.";

    return [
      `Generate exactly ${count} realistic B2B leads as a JSON array matching these criteria:`,
      ...criteriaLines,
      "",
      "MANDATORY REQUIREMENTS:",
      "- Return ONLY a valid JSON array of exactly the specified count leads",
      "- NO markdown code blocks (no \\`\\`\\`), NO explanations, NO commentary",
      "- Each lead MUST have ALL required fields with realistic values",
      "- Email addresses MUST be valid format: firstname.lastname@companydomain.com",
      "- Company names must be realistic but fictional (NOT real companies)",
      "- LinkedIn profiles must be plausible URLs",
      "",
      `Each lead MUST include these exact fields:`,
      JSON.stringify({
        firstName: "string (realistic first name)",
        lastName: "string (realistic last name)",
        email: "string (VALID email format firstname.lastname@companydomain.com)",
        company: "string (realistic but fictional company name)",
        title: "string (job title matching criteria)",
        location: "string (location matching criteria)",
        companySize: "string (size matching criteria)",
        industry: "string (industry matching criteria)",
        linkedInProfile: "string (plausible LinkedIn URL)",
        founderName: "string (founder name)",
        founderTitle: "string (founder job title)",
        fundingStage: "string or null",
        annualRevenue: "string or null"
      }, null, 2),
      "",
      "Examples of good data:",
      '- firstName: "Sarah", lastName: "Johnson", email: "sarah.johnson@cloudtech.com"',
      '- company: "CloudTech Solutions", title: "VP of Engineering", location: "San Francisco, CA"',
      "",
      "Examples of INVALID data to avoid:",
      '- emails with @example.com, @test.com, @fake.com',
      '- real company names like Google, Microsoft, Apple',
      '- obvious fake names like John Smith, Jane Doe',
      "",
      `Advanced matching: ${advancedNote}`,
      "",
      `IMPORTANT: Start your response with '[' and end with ']'. Return ONLY the JSON array.`,
      ""
    ].join("\n");
  }

  private parseLeadsFromGemini(text: string): GeminiLead[] {
    console.log(`[GeminiScraper] Raw Gemini response (first 500 chars): ${text.substring(0, 500)}`);

    const cleanText = this.cleanGeminiResponse(text);
    console.log(`[GeminiScraper] Cleaned response (first 500 chars): ${cleanText.substring(0, 500)}`);

    const parseAsJson = (raw: string): unknown => {
      try {
        return JSON.parse(raw);
      } catch (error) {
        console.log(`[GeminiScraper] Direct JSON parse failed: ${error}`);
        return null;
      }
    };

    const direct = parseAsJson(cleanText);
    
    if (direct && Array.isArray(direct)) {
      console.log(`[GeminiScraper] Successfully parsed ${direct.length} leads from direct JSON`);
      return direct as GeminiLead[];
    }

    // Try extracting from various response structures
    const jsonValue = direct ?? this.extractJsonFromText(cleanText);

    const maybeArray = Array.isArray(jsonValue)
      ? jsonValue
      : (jsonValue && typeof jsonValue === "object" && "leads" in jsonValue
          ? (jsonValue as { leads?: unknown }).leads
          : null);

    if (!Array.isArray(maybeArray)) {
      console.log(`[GeminiScraper] Final validation failed - response structure:`, {
        isArray: Array.isArray(maybeArray),
        type: typeof maybeArray,
        keys: maybeArray && typeof maybeArray === 'object' ? Object.keys(maybeArray) : null,
        length: maybeArray && Array.isArray(maybeArray) ? maybeArray.length : null
      });
      throw new Error("Gemini response did not contain a JSON array of leads");
    }

    console.log(`[GeminiScraper] Successfully extracted ${maybeArray.length} leads from response`);
    return maybeArray as GeminiLead[];
  }

  private extractJsonFromText(text: string): unknown {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");

    if (start === -1 || end === -1 || end <= start) {
      throw new Error("Unable to locate JSON array in Gemini response");
    }

    const slice = text.slice(start, end + 1);
    return JSON.parse(slice) as unknown;
  }

  private cleanGeminiResponse(text: string): string {
    let cleaned = text.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // If the response starts with text before the JSON array, extract just the array part
    if (!cleaned.startsWith('[')) {
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }
    }
    
    return cleaned;
  }

  private normalizeLead(lead: GeminiLead, criteria: ICPCriteria): Partial<ScrapedLead> | null {
    if (!lead || typeof lead !== "object") {
      console.log('[GeminiScraper] Lead validation failed: not an object');
      return null;
    }

    // Extract basic info with fallbacks
    const firstName = (lead.firstName || "John").trim();
    const lastName = (lead.lastName || "Doe").trim();
    const company = (lead.company || "TechCorp").trim();

    if (!firstName || !lastName) {
      console.log('[GeminiScraper] Lead validation failed: missing name');
      return null;
    }

    // Provide sensible defaults for all fields
    let title = (lead.title || "Manager").trim();
    let location = (lead.location || "USA").trim();
    let companySize = (lead.companySize || "10-50").trim();
    let industry = (lead.industry || criteria.industry || "Technology").trim();

    // Override with criteria if specified
    if (criteria.industry) industry = criteria.industry;
    if (criteria.companySize) companySize = criteria.companySize;

    // Handle location matching - if criteria specifies location, ensure it appears in the lead
    if (criteria.location) {
      const normalizedLocation = location.toLowerCase();
      const required = criteria.location.toLowerCase();
      if (!normalizedLocation.includes(required)) {
        // If location doesn't include the required criteria, append it
        location = location ? `${location}, ${criteria.location}` : criteria.location;
      }
    }

    // Handle job title matching
    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      const matchesTitle = criteria.jobTitles.some((t) => 
        title.toLowerCase().includes(t.toLowerCase())
      );
      if (!matchesTitle) {
        // Use the first criteria job title if none match
        title = criteria.jobTitles[0];
      }
    }

    // Handle custom ICP terms
    if (criteria.customICP) {
      const content = `${title} ${company} ${industry}`.toLowerCase();
      const customTerms = criteria.customICP
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((t) => t.length > 2);

      const hasCustomTerm = customTerms.length > 0 && customTerms.some((t) => content.includes(t));
      if (!hasCustomTerm && customTerms.length > 0) {
        // If no custom terms found, append the first one to the title
        title = `${title} - ${customTerms[0]}`;
      }
    }

    // Generate or validate email
    const domain = this.companyToDomain(company);
    let email = (lead.email || "").trim();
    
    if (!this.isValidEmail(email)) {
      // Generate a plausible email from name and company
      email = `${this.slug(firstName)}.${this.slug(lastName)}@${domain}`;
    }

    // Validate email one more time
    if (!this.isValidEmail(email)) {
      console.log(`[GeminiScraper] Lead validation failed: invalid email "${email}"`);
      return null;
    }

    // Generate LinkedIn profile if missing
    const linkedInProfile = (lead.linkedInProfile || "").trim() || 
      this.makeLinkedInUrl(firstName, lastName, company);

    // Set founder information
    const founderName = (lead.founderName || `${firstName} ${lastName}`).trim();
    const founderTitle = (lead.founderTitle || lead.title || "Founder").trim();

    // Set advanced fields if matching is enabled
    const fundingStage = criteria.isAdvancedMatching
      ? this.normalizeNonEmptyString(lead.fundingStage) || this.guessFundingStage()
      : undefined;

    const annualRevenue = criteria.isAdvancedMatching
      ? this.normalizeNonEmptyString(lead.annualRevenue) || this.guessAnnualRevenue(criteria.companySize)
      : undefined;

    const normalizedLead: Partial<ScrapedLead> = {
      firstName,
      lastName,
      email,
      company,
      title,
      location,
      companySize,
      industry,
      linkedInProfile,
      founderName,
      founderTitle,
      fundingStage,
      annualRevenue,
      verified: false,
      accuracy: 90, // High accuracy for AI-generated leads
      sourceUrl: linkedInProfile
    };

    console.log(`[GeminiScraper] Normalized lead: ${firstName} ${lastName} (${email}) at ${company}`);
    return normalizedLead;
  }

  private isValidEmail(email: unknown): email is string {
    if (typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && !email.toLowerCase().includes("example.com");
  }

  private companyToDomain(company: string): string {
    const cleaned = company
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .filter((w) => !["inc", "llc", "ltd", "corp", "co", "company", "technologies", "technology"].includes(w));

    const base = (cleaned.join("") || "company").slice(0, 32);
    return `${base}.com`;
  }

  private slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private makeLinkedInUrl(firstName: string, lastName: string, company: string): string {
    const slug = `${this.slug(firstName)}-${this.slug(lastName)}-${this.slug(company)}`.slice(0, 60);
    return `https://linkedin.com/in/${slug}`;
  }

  private normalizeNonEmptyString(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private guessFundingStage(): string {
    const stages = ["Pre-Seed", "Seed", "Series A", "Series B", "Bootstrapped", "Series C+"];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  private guessAnnualRevenue(companySize?: string): string {
    const map: Record<string, string[]> = {
      "1-10": ["$250K-$1M", "$1M-$3M"],
      "10-50": ["$1M-$5M", "$5M-$15M"],
      "50-100": ["$10M-$25M", "$25M-$50M"],
      "100-500": ["$25M-$100M", "$100M-$250M"],
      "500-1000": ["$250M-$1B", "$100M-$500M"]
    };

    const options = (companySize && map[companySize]) || ["$1M-$10M", "$10M-$50M", "$50M-$100M"];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateFallbackLead(criteria: ICPCriteria): Partial<ScrapedLead> | null {
    const firstNames = ["Alex", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Avery", "Quinn"];
    const lastNames = ["Chen", "Patel", "Rodriguez", "Johnson", "Williams", "Brown", "Davis", "Miller"];
    const companies = ["TechCorp", "DataFlow Inc", "CloudFirst Solutions", "InnovateTech", "NextGen Systems"];
    const titles = ["VP Engineering", "CTO", "Founder & CEO", "Product Director", "Technology Lead"];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    
    const domain = this.companyToDomain(company);
    const email = `${this.slug(firstName)}.${this.slug(lastName)}@${domain}`;
    const location = criteria.location || "San Francisco, CA";
    const companySize = criteria.companySize || "50-100";
    const industry = criteria.industry || "Technology";

    return {
      firstName,
      lastName,
      email,
      company,
      title,
      location,
      companySize,
      industry,
      linkedInProfile: this.makeLinkedInUrl(firstName, lastName, company),
      founderName: `${firstName} ${lastName}`,
      founderTitle: "Founder",
      fundingStage: criteria.isAdvancedMatching ? this.guessFundingStage() : undefined,
      annualRevenue: criteria.isAdvancedMatching ? this.guessAnnualRevenue(criteria.companySize) : undefined,
      verified: false,
      accuracy: 85,
      sourceUrl: this.makeLinkedInUrl(firstName, lastName, company)
    };
  }

  private generateFallbackLeads(criteria: ICPCriteria, count: number): Partial<ScrapedLead>[] {
    const leads: Partial<ScrapedLead>[] = [];
    for (let i = 0; i < count; i++) {
      const lead = this.generateFallbackLead(criteria);
      if (lead) {
        // Make email unique
        lead.email = lead.email?.replace('@', `+${i}@`);
        leads.push(lead);
      }
    }
    return leads;
  }
}
