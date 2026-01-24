# Supabase Integration Guide

This guide explains how to set up and use the Supabase integration for storing and managing leads in the Taggle app.

## Overview

The Taggle app now includes Supabase integration for storing leads in a PostgreSQL database. This allows you to:

- Store leads permanently in your own Supabase database
- Filter leads by country, city, and business type
- Import leads via CSV
- Manage leads with a clean, searchable interface

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aoxrfelugismctfjppol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Database Schema

Create a `leads` table in your Supabase database with the following schema:

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  "socialMedia" TEXT,
  country TEXT NOT NULL,
  city TEXT,
  "businessType" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_leads_userId ON leads("userId");
CREATE INDEX idx_leads_country ON leads(country);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_businessType ON leads("businessType");
CREATE INDEX idx_leads_createdAt ON leads("createdAt");
```

Alternatively, you can use snake_case column names (Supabase default):

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  social_media TEXT,
  country TEXT NOT NULL,
  city TEXT,
  business_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_country ON leads(country);
CREATE INDEX idx_leads_city ON leads(city);
CREATE INDEX idx_leads_business_type ON leads(business_type);
CREATE INDEX idx_leads_created_at ON leads(created_at);
```

**Note:** The app automatically handles both camelCase and snake_case column names, so either format will work.

### 3. Row Level Security (RLS)

Enable Row Level Security on the leads table and add policies:

```sql
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own leads
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (auth.uid()::text = "userId");

-- Policy: Users can insert their own leads
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Policy: Users can update their own leads
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  USING (auth.uid()::text = "userId");

-- Policy: Users can delete their own leads
CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  USING (auth.uid()::text = "userId");
```

For snake_case:

```sql
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own leads
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own leads
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own leads
CREATE POLICY "Users can update own leads"
  ON leads FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own leads
CREATE POLICY "Users can delete own leads"
  ON leads FOR DELETE
  USING (auth.uid()::text = user_id);
```

## Features

### My Leads Page (`/dashboard/leads`)

The My Leads page displays all leads stored in your Supabase database with the following features:

- **Search & Filter**: Filter leads by country, city, and business type
- **Responsive Table**: Clean, mobile-friendly table view
- **Copy Actions**: Quick copy buttons for email and phone numbers
- **Empty State**: Helpful instructions when no leads are present

### API Routes

#### GET `/api/leads`
Fetch all leads for the authenticated user with optional filters.

Query parameters:
- `country` - Filter by country
- `city` - Filter by city  
- `businessType` - Filter by business type

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "country": "USA",
      "city": "New York",
      "businessType": "SaaS",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/leads/search`
Search leads with filters.

Request body:
```json
{
  "country": "USA",
  "city": "New York",
  "businessType": "SaaS"
}
```

Response: Same as GET `/api/leads`

#### GET `/api/leads/countries`
Get list of all unique countries in the database.

Response:
```json
{
  "success": true,
  "countries": ["USA", "Canada", "UK"]
}
```

#### GET `/api/leads/cities?country=USA`
Get list of cities for a specific country.

Response:
```json
{
  "success": true,
  "cities": ["New York", "Los Angeles", "Chicago"]
}
```

#### POST `/api/leads/import`
Bulk import leads from CSV (for future use).

Request body:
```json
{
  "leads": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "country": "USA",
      ...
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "imported": 10
}
```

## Importing Leads via CSV

To import leads via the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to **Table Editor** → **leads**
3. Click **Insert** → **Import data from CSV**
4. Upload your CSV file (ensure columns match the schema)
5. Refresh the My Leads page in Taggle

### CSV Format Example

```csv
userId,name,email,phone,country,city,businessType
user_123,John Doe,john@example.com,+1234567890,USA,New York,SaaS
user_123,Jane Smith,jane@example.com,+0987654321,USA,Los Angeles,E-commerce
```

## Navigation

The app has two separate lead-related pages:

- **Lead Scraper** (`/dashboard/leads/scraper`) - Scrape new leads using AI
- **My Leads** (`/dashboard/leads`) - View and manage Supabase stored leads

Both are accessible from the sidebar.

## Components

### CountrySelector
Dropdown to select country, populated from database.

### CitySelector
Dropdown to select city, changes based on selected country.

### LeadsTable
Clean table view with copy buttons for email/phone.

### EmptyState
Shows when no leads exist, with instructions for CSV import.

## Error Handling

The integration includes comprehensive error handling:

- Graceful handling when Supabase is not configured
- User-friendly error messages
- Fallback for both camelCase and snake_case column names
- Loading states for async operations

## Future Enhancements

Planned features (not yet implemented):

- Export leads to CSV
- Direct CSV upload from app
- Add/edit leads manually
- Delete leads
- Mark leads as contacted
- Bulk actions

## Troubleshooting

### "Supabase not configured" error
Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`.

### No leads showing
1. Check that leads exist in your Supabase `leads` table
2. Verify RLS policies are set up correctly
3. Ensure the `userId` matches your authenticated user ID

### Column does not exist errors
The app handles both camelCase and snake_case column names automatically. If you still see errors, verify your table schema matches one of the formats in this guide.

## Support

For issues or questions, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Project README.md
