import { BaseScraper, type ICPCriteria, type ScrapedLead, type ScrapingResult } from "./base-scraper";

export class MockScraper extends BaseScraper {
  constructor() {
    super("mock://localhost", "mock");
  }

  generateSearchQueries(_criteria: ICPCriteria): string[] {
    return ["mock-query"];
  }

  async scrapePage(_query: string): Promise<Partial<ScrapedLead>[]> {
    return []; // Not used in simplified scrape
  }

  extractContactInfo(_content: string): string | null {
    return null;
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    const count = criteria.desiredLeads || 25;
    const leads: ScrapedLead[] = [];

    const industries = ["SaaS", "Fintech", "Healthcare", "E-commerce", "AI/ML"];
    const locations = ["San Francisco, USA", "New York, USA", "London, UK", "Berlin, Germany", "Austin, USA"];
    const companySizes = ["1-10", "10-50", "50-100", "100-500", "500-1000"];
    const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
    const companies = ["Acme Corp", "TechFlow", "Stellar Solutions", "Nexus Systems", "Infinity Labs"];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const industry = criteria.industry || industries[Math.floor(Math.random() * industries.length)];
      const location = criteria.location || locations[Math.floor(Math.random() * locations.length)];
      const companySize = criteria.companySize || companySizes[Math.floor(Math.random() * companySizes.length)];
      
      const lead: ScrapedLead = {
        id: `mock-${Date.now()}-${i}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s/g, '')}.com`,
        company,
        title: criteria.jobTitles?.[0] || "Director of Engineering",
        location,
        companySize,
        industry,
        matchQualityScore: 75,
        isMockData: true,
        source: "mock",
        sourceUrl: "mock://localhost"
      };
      leads.push(lead);
    }

    return {
      leads,
      errors: [],
      sources: ["mock"]
    };
  }
}
