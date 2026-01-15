-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY, -- Changed to VARCHAR for Clerk ID compatibility
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'lite',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leads table (indexed for fast queries)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR for Clerk ID compatibility
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  company_size VARCHAR(50) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  linkedin_profile VARCHAR(500),
  funding_stage VARCHAR(100),
  annual_revenue VARCHAR(100),
  match_quality_score INT DEFAULT 0,
  is_mock_data BOOLEAN DEFAULT false,
  source VARCHAR(50) DEFAULT 'llm', -- 'llm' or 'mock'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries (CRITICAL for billion records)
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_company_size ON leads(company_size);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Search criteria tracking
CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR for Clerk ID compatibility
  industry VARCHAR(100),
  location VARCHAR(100),
  company_size VARCHAR(50),
  job_titles TEXT,
  leads_found INT,
  created_at TIMESTAMP DEFAULT NOW()
);
