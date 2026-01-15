import { Pool } from 'pg';
import { type ScrapedLead, type ICPCriteria } from '../scrapers/base-scraper';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function saveLeads(userId: string, leads: ScrapedLead[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const lead of leads) {
      await client.query(
        `INSERT INTO leads (
          user_id, first_name, last_name, email, company, title, location, 
          company_size, industry, linkedin_profile, funding_stage, 
          annual_revenue, match_quality_score, is_mock_data, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          userId,
          lead.firstName,
          lead.lastName,
          lead.email,
          lead.company,
          lead.title,
          lead.location,
          lead.companySize,
          lead.industry,
          lead.linkedInProfile || null,
          lead.fundingStage || null,
          lead.annualRevenue || null,
          lead.matchQualityScore || 0,
          lead.isMockData || false,
          lead.source
        ]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function saveSearchHistory(userId: string, criteria: ICPCriteria, leadsFound: number) {
  await pool.query(
    `INSERT INTO search_history (
      user_id, industry, location, company_size, job_titles, leads_found
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      criteria.industry || null,
      criteria.location || null,
      criteria.companySize || null,
      (criteria.jobTitles || []).join(', ') || null,
      leadsFound
    ]
  );
}

export async function getLeadsByUser(userId: string, page: number = 1, limit: number = 50) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    'SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, offset]
  );
  return result.rows;
}

export async function searchLeadsInDb(userId: string, criteria: ICPCriteria) {
  let query = 'SELECT * FROM leads WHERE user_id = $1';
  const params: (string | number | boolean | null)[] = [userId];
  let paramIndex = 2;

  if (criteria.industry) {
    query += ` AND industry ILIKE $${paramIndex++}`;
    params.push(`%${criteria.industry}%`);
  }
  if (criteria.location) {
    query += ` AND location ILIKE $${paramIndex++}`;
    params.push(`%${criteria.location}%`);
  }
  if (criteria.companySize) {
    query += ` AND company_size = $${paramIndex++}`;
    params.push(criteria.companySize);
  }

  query += ' ORDER BY created_at DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
}
