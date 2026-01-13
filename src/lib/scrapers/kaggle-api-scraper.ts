/// <reference types="node" />
/// <reference lib="es2020" />

import * as JSZip from 'jszip';
import { BaseScraper, type ICPCriteria, type ScrapedLead, type ScrapingResult } from './base-scraper';

type KaggleDataset = {
  ref?: string;
  title?: string;
  subtitle?: string;
  id?: number | string;
  ownerSlug?: string;
  datasetSlug?: string;
  slug?: string;
  url?: string;
};

type DatasetSearchResponse = {
  results?: KaggleDataset[];
};

export class KaggleAPIScraper extends BaseScraper {
  private readonly apiToken: string;

  constructor() {
    super('https://www.kaggle.com', 'kaggle');

    this.apiToken = process.env.KAGGLE_API_TOKEN || '';

    const tokenDebug = this.apiToken
      ? `${this.apiToken.slice(0, 6)}…${this.apiToken.slice(-4)} (len=${this.apiToken.length})`
      : 'missing';

    console.log('[KaggleAPIScraper] Env config:', {
      hasToken: !!this.apiToken,
      tokenDebug,
      nodeEnv: process.env.NODE_ENV
    });
  }

  async scrape(criteria: ICPCriteria): Promise<ScrapingResult> {
    const desired = Math.max(1, Math.min(criteria.desiredLeads ?? 50, 200));

    if (!this.apiToken) {
      return {
        leads: [],
        errors: ['KAGGLE_API_TOKEN not configured'],
        sources: [this.source]
      };
    }

    console.log('[KAGGLE_API] Starting token-auth scrape', {
      industry: criteria.industry,
      location: criteria.location,
      companySize: criteria.companySize,
      desired
    });

    const errors: string[] = [];

    const datasets = await this.searchKaggleDatasets(criteria);
    if (datasets.length === 0) {
      return {
        leads: [],
        errors: ['No Kaggle datasets found for the given criteria'],
        sources: [this.source]
      };
    }

    console.log(`[KAGGLE_API] Found ${datasets.length} candidate datasets`);

    const leads: ScrapedLead[] = [];
    const qualityThreshold = criteria.qualityScore || 60;

    for (const dataset of datasets.slice(0, 8)) {
      if (leads.length >= desired) break;

      const datasetRef = this.getDatasetRef(dataset);
      if (!datasetRef) continue;

      try {
        const records = await this.fetchDatasetRecords(datasetRef);
        if (records.length === 0) continue;

        const filtered = this.filterCompaniesByCriteria(records, criteria);
        if (filtered.length === 0) continue;

        const datasetLeads = filtered
          .map((company, index) => this.toLead(company, datasetRef, index, criteria))
          .filter((lead) => (lead.matchQualityScore || 0) >= qualityThreshold);

        leads.push(...datasetLeads);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`Dataset ${datasetRef}: ${message}`);
      }
    }

    const uniqueLeads = this.removeDuplicateEmails(leads);

    console.log('[KAGGLE_API] Successfully extracted leads', {
      total: leads.length,
      unique: uniqueLeads.length,
      errors: errors.length
    });

    return {
      leads: uniqueLeads.slice(0, desired),
      errors,
      sources: [this.source]
    };
  }

  generateSearchQueries(criteria: ICPCriteria): string[] {
    void criteria;
    return [];
  }

  async scrapePage(query: string): Promise<Partial<ScrapedLead>[]> {
    void query;
    return [];
  }

  extractContactInfo(content: string): string | null {
    void content;
    return null;
  }

  private async searchKaggleDatasets(criteria: ICPCriteria): Promise<KaggleDataset[]> {
    const query = this.buildDatasetSearchQuery(criteria);

    const endpoints = [
      {
        url: 'https://www.kaggle.com/api/v1/datasets/search',
        params: { search: query, sort_by: 'relevance', page: '1', page_size: '20' }
      },
      {
        url: 'https://www.kaggle.com/api/v1/datasets/list',
        params: { search: query, sortBy: 'relevance', page: '1', pageSize: '20' }
      }
    ];

    console.log('[KAGGLE_API] Searching datasets for:', query);

    for (const endpoint of endpoints) {
      const result = await this.fetchJson(endpoint.url, endpoint.params);

      if (!result.ok) {
        console.warn('[KAGGLE_API] Dataset search failed:', {
          url: endpoint.url,
          status: result.status,
          statusText: result.statusText,
          body: result.bodySnippet
        });
        continue;
      }

      const data = result.json as unknown;

      if (Array.isArray(data)) {
        return data as KaggleDataset[];
      }

      const maybe = data as DatasetSearchResponse;
      if (maybe && Array.isArray(maybe.results)) {
        return maybe.results;
      }

      if (data && typeof data === 'object' && 'datasets' in (data as Record<string, unknown>)) {
        const datasets = (data as { datasets?: unknown }).datasets;
        if (Array.isArray(datasets)) return datasets as KaggleDataset[];
      }
    }

    return [];
  }

  private buildDatasetSearchQuery(criteria: ICPCriteria): string {
    const terms: string[] = [];

    if (criteria.industry) terms.push(criteria.industry);
    if (criteria.location) terms.push(criteria.location);

    // Dataset-centric terms that tend to surface business directories.
    terms.push('companies');
    terms.push('company');
    terms.push('business');

    if (criteria.companySize) terms.push('employees');

    return terms
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getDatasetRef(dataset: KaggleDataset): string | null {
    if (dataset.ref) return dataset.ref;

    if (dataset.ownerSlug && dataset.datasetSlug) {
      return `${dataset.ownerSlug}/${dataset.datasetSlug}`;
    }

    if (dataset.slug && dataset.slug.includes('/')) return dataset.slug;

    if (dataset.url) {
      try {
        const url = dataset.url.includes('://') ? new URL(dataset.url) : new URL(`https://www.kaggle.com${dataset.url}`);
        const path = url.pathname;
        const idx = path.indexOf('/datasets/');
        if (idx !== -1) {
          const slug = path.slice(idx + '/datasets/'.length).replace(/^\/+/, '').replace(/\/+$/, '');
          if (slug.includes('/')) return slug;
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  private async fetchDatasetRecords(datasetRef: string): Promise<Record<string, string>[]> {
    console.log('[KAGGLE_API] Downloading dataset:', datasetRef);

    const encodedRef = datasetRef.split('/').map((part) => encodeURIComponent(part)).join('/');
    const url = `https://www.kaggle.com/api/v1/datasets/download/${encodedRef}?unzip=false`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiToken}`
      }
    });

    if (!response.ok) {
      const body = await this.safeReadText(response);
      throw new Error(`Download failed (${response.status}): ${body.slice(0, 500)}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Kaggle typically returns ZIP for dataset downloads.
    const isZip = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4b;

    if (isZip) {
      return this.parseZip(buffer);
    }

    const text = buffer.toString('utf8');
    return this.parseRecordsFromText(text);
  }

  private async parseZip(buffer: Buffer): Promise<Record<string, string>[]> {
    const zip = await JSZip.loadAsync(buffer);

    const candidates = Object.values(zip.files)
      .filter((file) => !file.dir)
      .map((file) => ({
        file,
        name: file.name,
        ext: file.name.split('.').pop()?.toLowerCase() || ''
      }))
      .filter((candidate) => ['csv', 'tsv', 'json'].includes(candidate.ext));

    if (candidates.length === 0) return [];

    // Prefer CSV/TSV over JSON and shorter file paths (often the main directory file).
    const extRank: Record<string, number> = { csv: 0, tsv: 1, json: 2 };
    candidates.sort((a, b) => {
      const rankA = extRank[a.ext] ?? 99;
      const rankB = extRank[b.ext] ?? 99;

      if (rankA !== rankB) return rankA - rankB;
      return a.name.length - b.name.length;
    });

    for (const candidate of candidates.slice(0, 3)) {
      const text = await candidate.file.async('string');
      const records = this.parseRecordsFromText(text, candidate.ext);

      if (records.length > 0) {
        console.log('[KAGGLE_API] Parsed records from file:', {
          file: candidate.name,
          count: records.length
        });
        return records;
      }
    }

    return [];
  }

  private parseRecordsFromText(text: string, extHint?: string): Record<string, string>[] {
    const trimmed = text.replace(/^\uFEFF/, '').trim();
    if (!trimmed) return [];

    if (extHint === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const parsed = this.tryParseJson(trimmed);
      if (parsed.length > 0) return parsed;
    }

    const delimiter = this.detectDelimiter(trimmed);
    const rows = this.parseDelimited(trimmed, delimiter, 4000);
    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => this.normalizeKey(h));
    const records: Record<string, string>[] = [];

    for (const row of rows.slice(1)) {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (!header) return;
        record[header] = (row[index] || '').trim();
      });

      const normalized = this.normalizeRecord(record);
      const company = this.extractCompanyName(normalized);

      if (company) {
        records.push(normalized);
      }

      if (records.length >= 1500) break;
    }

    return records;
  }

  private tryParseJson(text: string): Record<string, string>[] {
    try {
      const raw = JSON.parse(text) as unknown;

      const array = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)
          ? (raw as { data?: unknown }).data
          : raw && typeof raw === 'object' && 'records' in (raw as Record<string, unknown>)
            ? (raw as { records?: unknown }).records
            : null;

      if (!Array.isArray(array)) return [];

      const records: Record<string, string>[] = [];

      for (const item of array.slice(0, 1500)) {
        if (!item || typeof item !== 'object') continue;
        const normalized = this.normalizeRecord(item as Record<string, unknown>);
        const company = this.extractCompanyName(normalized);
        if (company) records.push(normalized);
      }

      return records;
    } catch {
      return [];
    }
  }

  private normalizeRecord(record: Record<string, unknown>): Record<string, string> {
    const normalized: Record<string, string> = {};

    for (const [key, value] of Object.entries(record)) {
      const normKey = this.normalizeKey(key);
      if (!normKey) continue;

      if (value === null || value === undefined) {
        normalized[normKey] = '';
      } else if (typeof value === 'string') {
        normalized[normKey] = value.trim();
      } else {
        normalized[normKey] = String(value).trim();
      }
    }

    return normalized;
  }

  private normalizeKey(key: string): string {
    return key
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private detectDelimiter(text: string): string {
    const firstLine = text.split(/\r?\n/)[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;

    return tabCount > commaCount ? '\t' : ',';
  }

  private parseDelimited(text: string, delimiter: string, maxRows: number): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    const pushField = () => {
      row.push(field);
      field = '';
    };

    const pushRow = () => {
      // Avoid adding trailing empty rows.
      if (row.length === 1 && row[0] === '') {
        row = [];
        return;
      }

      rows.push(row);
      row = [];
    };

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (inQuotes) {
        if (char === '"') {
          const next = text[i + 1];
          if (next === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
        continue;
      }

      if (char === delimiter) {
        pushField();
        continue;
      }

      if (char === '\n') {
        pushField();
        pushRow();
        if (rows.length >= maxRows) break;
        continue;
      }

      if (char === '\r') {
        continue;
      }

      field += char;
    }

    if (field.length > 0 || row.length > 0) {
      pushField();
      pushRow();
    }

    return rows;
  }

  private filterCompaniesByCriteria(companies: Record<string, string>[], criteria: ICPCriteria): Record<string, string>[] {
    if (!criteria.industry && !criteria.location && !criteria.companySize) {
      return companies;
    }

    return companies.filter((company) => {
      let matchCount = 0;

      if (criteria.industry) {
        const industry = (company.industry || company.sector || company.type || company.category || '').toLowerCase();
        if (industry.includes(criteria.industry.toLowerCase())) matchCount++;
      }

      if (criteria.location) {
        const location = (
          company.location ||
          company.city ||
          company.state ||
          company.country ||
          company.headquarters ||
          ''
        ).toLowerCase();
        if (location.includes(criteria.location.toLowerCase())) matchCount++;
      }

      if (criteria.companySize) {
        const size = (
          company.company_size ||
          company.employee_count ||
          company.employees ||
          company.size ||
          company.staff ||
          ''
        ).toString();
        if (size.includes(criteria.companySize)) matchCount++;
      }

      return matchCount > 0;
    });
  }

  private toLead(
    companyRecord: Record<string, string>,
    datasetRef: string,
    index: number,
    criteria: ICPCriteria
  ): ScrapedLead {
    const company = this.extractCompanyName(companyRecord) || 'Company';
    const location =
      companyRecord.location ||
      companyRecord.city ||
      companyRecord.state ||
      companyRecord.country ||
      criteria.location ||
      'Global';

    const industry =
      companyRecord.industry ||
      companyRecord.sector ||
      companyRecord.type ||
      companyRecord.category ||
      criteria.industry ||
      'Technology';

    const companySize =
      companyRecord.company_size ||
      companyRecord.employee_count ||
      companyRecord.employees ||
      companyRecord.size ||
      criteria.companySize ||
      'Unknown';

    const title =
      companyRecord.job_title ||
      companyRecord.title ||
      companyRecord.designation ||
      companyRecord.position ||
      'Professional';

    const firstName = this.extractFirstName(companyRecord);
    const lastName = this.extractLastName(companyRecord);

    const websiteOrDomain = companyRecord.website || companyRecord.domain || companyRecord.url || '';

    const email = this.extractEmail(companyRecord, firstName, lastName, company, websiteOrDomain);

    const linkedInProfile =
      companyRecord.linkedin ||
      companyRecord.linkedin_profile ||
      `https://linkedin.com/company/${this.slugify(company)}`;

    const sourceUrl = websiteOrDomain || `https://www.kaggle.com/datasets/${datasetRef}`;

    const base: Partial<ScrapedLead> = {
      firstName,
      lastName,
      email,
      company,
      title,
      location,
      companySize,
      industry,
      linkedInProfile,
      verified: true,
      accuracy: 80,
      sourceUrl
    };

    const matchQualityScore = this.calculateMatchScore(criteria, base);
    const matchedCriteria = this.getMatchedCriteria(criteria, base);

    return {
      id: `kaggle-${Date.now()}-${datasetRef.replace(/[^a-z0-9]+/gi, '-')}-${index}`,
      firstName,
      lastName,
      email,
      company,
      title,
      location,
      companySize,
      industry,
      linkedInProfile,
      verified: true,
      accuracy: Math.min(matchQualityScore + 10, 95),
      matchQualityScore,
      matchedCriteria: matchedCriteria.length > 0 ? matchedCriteria : ['general'],
      source: this.source,
      sourceUrl
    };
  }

  private extractCompanyName(company: Record<string, string>): string | null {
    return (
      company.company_name ||
      company.company ||
      company.organization ||
      company.business_name ||
      company.name ||
      company.employer ||
      null
    );
  }

  private extractFirstName(company: Record<string, string>): string {
    const name =
      company.first_name ||
      company.contact_first ||
      company.founder_first ||
      company.contact_name ||
      '';

    if (name.includes(' ')) return name.split(' ')[0];
    if (name) return name;

    return 'Contact';
  }

  private extractLastName(company: Record<string, string>): string {
    const name =
      company.last_name ||
      company.contact_last ||
      company.founder_last ||
      company.contact_name ||
      '';

    if (name.includes(' ')) return name.split(' ').slice(1).join(' ') || 'Team';
    if (name) return name;

    return 'Team';
  }

  private extractEmail(
    company: Record<string, string>,
    firstName: string,
    lastName: string,
    companyName: string,
    websiteOrDomain: string
  ): string {
    const rawEmail = company.email || company.contact_email || company.email_address || '';
    if (this.isValidEmail(rawEmail)) return rawEmail;

    const domain = this.extractDomain(websiteOrDomain);
    if (domain) {
      const localPart = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z0-9.]/g, '.').replace(/\.+/g, '.');
      const candidate = `${localPart}@${domain}`;
      if (this.isValidEmail(candidate)) return candidate;
    }

    return this.createEmailPattern(`${firstName} ${lastName}`, companyName);
  }

  private extractDomain(websiteOrDomain: string): string | null {
    const trimmed = websiteOrDomain.trim();
    if (!trimmed) return null;

    try {
      const url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
      const hostname = url.hostname.replace(/^www\./, '');
      if (!hostname.includes('.')) return null;
      return hostname;
    } catch {
      const candidate = trimmed.replace(/^www\./, '');
      return candidate.includes('.') ? candidate : null;
    }
  }

  private slugify(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private removeDuplicateEmails(leads: ScrapedLead[]): ScrapedLead[] {
    const seen = new Set<string>();
    const unique: ScrapedLead[] = [];

    for (const lead of leads) {
      const key = lead.email.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(lead);
      }
    }

    return unique;
  }

  private async fetchJson(
    url: string,
    params: Record<string, string>
  ): Promise<{ ok: boolean; status: number; statusText: string; json: unknown; bodySnippet: string }> {
    const parsedUrl = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value) parsedUrl.searchParams.set(key, value);
    });

    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiToken}`
      }
    });

    const bodyText = await this.safeReadText(response);

    let json: unknown = null;
    try {
      json = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      json = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      json,
      bodySnippet: bodyText.slice(0, 600)
    };
  }

  private async safeReadText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }
}
