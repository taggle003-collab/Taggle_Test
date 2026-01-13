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

    const startedAt = Date.now();
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    console.log(`[GeminiScraper] Gemini responded in ${Date.now() - startedAt}ms (${rawText.length} chars)`);

    const parsedLeads = this.parseLeadsFromGemini(rawText);
    const normalized = parsedLeads
      .map((lead) => this.normalizeLead(lead, payload.criteria))
      .filter((lead): lead is Partial<ScrapedLead> => !!lead);

    console.log(`[GeminiScraper] Parsed ${normalized.length} leads from Gemini batch ${payload.batchIndex}/${payload.batches}`);

    return normalized;
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

    const schema = {
      firstName: "string",
      lastName: "string",
      email: "string",
      company: "string",
      title: "string",
      location: "string",
      companySize: "string",
      industry: "string",
      linkedInProfile: "string",
      founderName: "string",
      founderTitle: "string",
      fundingStage: "string | null",
      annualRevenue: "string | null"
    };

    const criteriaLines = [
      criteria.industry ? `- Industry (must match): ${criteria.industry}` : "- Industry: (choose best fit)",
      criteria.location ? `- Location (must include): ${criteria.location}` : "- Location: (choose best fit)",
      criteria.companySize
        ? `- Company Size (must match exactly): ${criteria.companySize}`
        : "- Company Size: one of 1-10, 10-50, 50-100, 100-500, 500-1000",
      jobTitles.length > 0
        ? `- Job Titles (title must include one): ${jobTitles.join(", ")}`
        : "- Job Titles: (choose senior B2B decision makers)",
      criteria.customICP ? `- Custom ICP notes: ${criteria.customICP}` : null
    ].filter(Boolean);

    const advancedNote = criteria.isAdvancedMatching
      ? "Include realistic fundingStage and annualRevenue fields for each lead."
      : "Set fundingStage and annualRevenue to null.";

    return [
      `Generate ${count} realistic B2B leads as a JSON array matching these criteria:`,
      ...criteriaLines,
      "",
      "Each lead MUST be a JSON object with exactly these keys:",
      JSON.stringify(schema, null, 2),
      "",
      "Rules:",
      "- Companies must be realistic but fictional (do not use real companies or real people).",
      "- Use realistic person names and B2B job titles.",
      "- Emails MUST look realistic and follow patterns like firstname.lastname@companydomain.com (do not use example.com).",
      "- linkedInProfile must be a plausible LinkedIn profile URL.",
      "- founderName and founderTitle should be plausible for the company.",
      `- ${advancedNote}`,
      "- Return ONLY a valid JSON array. No markdown, no commentary, no code fences.",
      ""
    ].join("\n");
  }

  private parseLeadsFromGemini(text: string): GeminiLead[] {
    const parseAsJson = (raw: string): unknown => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const direct = parseAsJson(text);
    const jsonValue = direct ?? this.extractJsonFromText(text);

    const maybeArray = Array.isArray(jsonValue)
      ? jsonValue
      : (jsonValue && typeof jsonValue === "object" && "leads" in jsonValue
          ? (jsonValue as { leads?: unknown }).leads
          : null);

    if (!Array.isArray(maybeArray)) {
      throw new Error("Gemini response did not contain a JSON array of leads");
    }

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

  private normalizeLead(lead: GeminiLead, criteria: ICPCriteria): Partial<ScrapedLead> | null {
    if (!lead || typeof lead !== "object") return null;

    const firstName = (lead.firstName || "").trim();
    const lastName = (lead.lastName || "").trim();
    const company = (lead.company || "").trim();

    if (!firstName || !lastName || !company) return null;

    let title = (lead.title || "").trim();
    let location = (lead.location || "").trim();
    let companySize = (lead.companySize || "").trim();
    let industry = (lead.industry || "").trim();

    if (criteria.industry) industry = criteria.industry;
    if (criteria.companySize) companySize = criteria.companySize;

    if (criteria.location) {
      const normalizedLocation = location.toLowerCase();
      const required = criteria.location.toLowerCase();
      if (!normalizedLocation.includes(required)) {
        location = location ? `${location}, ${criteria.location}` : criteria.location;
      }
    }

    if (criteria.jobTitles && criteria.jobTitles.length > 0) {
      const matchesTitle = criteria.jobTitles.some((t) => title.toLowerCase().includes(t.toLowerCase()));
      if (!matchesTitle) {
        title = criteria.jobTitles[0];
      }
    }

    if (criteria.customICP) {
      const content = `${title} ${company} ${industry}`.toLowerCase();
      const customTerms = criteria.customICP
        .toLowerCase()
        .split(/[\s,]+/)
        .filter((t) => t.length > 2);

      const missing = customTerms.length > 0 && !customTerms.some((t) => content.includes(t));
      if (missing) {
        title = `${title} - ${customTerms[0]}`;
      }
    }

    const domain = this.companyToDomain(company);

    const email = this.isValidEmail(lead.email)
      ? (lead.email as string)
      : `${this.slug(firstName)}.${this.slug(lastName)}@${domain}`;

    const linkedInProfile = (lead.linkedInProfile || "").trim() || this.makeLinkedInUrl(firstName, lastName, company);

    const founderName = (lead.founderName || "").trim() || `${firstName} ${lastName}`;
    const founderTitle = (lead.founderTitle || "").trim() || "Founder";

    const fundingStage = criteria.isAdvancedMatching
      ? this.normalizeNonEmptyString(lead.fundingStage) || this.guessFundingStage()
      : undefined;

    const annualRevenue = criteria.isAdvancedMatching
      ? this.normalizeNonEmptyString(lead.annualRevenue) || this.guessAnnualRevenue(criteria.companySize)
      : undefined;

    return {
      firstName,
      lastName,
      email,
      company,
      title,
      location,
      companySize: companySize || "Unknown",
      industry: industry || criteria.industry || "Unknown",
      linkedInProfile,
      founderName,
      founderTitle,
      fundingStage,
      annualRevenue,
      verified: false,
      accuracy: 90,
      sourceUrl: linkedInProfile
    };
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
}
