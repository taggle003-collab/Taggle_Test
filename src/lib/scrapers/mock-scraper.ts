import { BaseScraper, type ICPCriteria, type ScrapedLead, type ScrapingResult } from './base-scraper';

export class MockScraper extends BaseScraper {
  constructor() {
    super('https://mock', 'mock');
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    console.log('[MOCK_SCRAPER] Generating mock leads');
    
    const companies = [
      { name: 'Acme Corp', industry: 'SaaS', size: '50-100', location: 'San Francisco, USA' },
      { name: 'TechStart Inc', industry: 'SaaS', size: '10-50', location: 'New York, USA' },
      { name: 'CloudHub', industry: 'Cloud', size: '100-500', location: 'Austin, USA' },
      { name: 'DataFlow Systems', industry: 'Data', size: '50-100', location: 'Seattle, USA' },
      { name: 'SecureNet', industry: 'Security', size: '10-50', location: 'Boston, USA' },
      { name: 'InnovateLabs', industry: 'AI/ML', size: '20-50', location: 'San Jose, USA' },
      { name: 'BizGrowth', industry: 'SaaS', size: '100-500', location: 'Chicago, USA' },
      { name: 'FastAPI Corp', industry: 'API', size: '50-100', location: 'Denver, USA' },
      { name: 'CloudFirst', industry: 'Cloud', size: '200-500', location: 'Portland, USA' },
      { name: 'DataViz Pro', industry: 'Analytics', size: '10-50', location: 'Los Angeles, USA' }
    ];

    const leads: ScrapedLead[] = [];
    const desired = criteria.desiredLeads || 25;

    for (let i = 0; i < Math.min(desired, companies.length * 2); i++) {
      const company = companies[i % companies.length];
      const idx = Math.floor(i / companies.length);
      
      leads.push({
        id: `mock-${Date.now()}-${i}`,
        firstName: this.getFirstName(idx),
        lastName: this.getLastName(idx),
        email: `${this.getFirstName(idx).toLowerCase()}.${this.getLastName(idx).toLowerCase()}@${company.name.toLowerCase().replace(/\s/g, '')}.com`,
        company: company.name,
        title: this.getTitle(idx),
        location: company.location,
        companySize: company.size,
        industry: company.industry,
        matchQualityScore: 70,
        isMockData: true,
        source: 'mock'
      });
    }

    return {
      leads: leads.slice(0, desired),
      errors: [],
      sources: [this.source]
    };
  }

  private getFirstName(idx: number): string {
    const names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'];
    return names[idx % names.length];
  }

  private getLastName(idx: number): string {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return names[idx % names.length];
  }

  private getTitle(idx: number): string {
    const titles = ['CEO', 'CTO', 'Director', 'Manager', 'VP', 'Founder', 'Lead'];
    return titles[idx % titles.length];
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
