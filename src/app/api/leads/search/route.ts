import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Lead } from "@/lib/lead-types";
import { rateLimiter } from "@/lib/rate-limiter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[LEADS_SEARCH] Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Database record type from Supabase
interface DatabaseLead {
  id: string;
  Name: string;
  Emails?: string;
  Phone?: string;
  Address?: string;
  Website?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
  tiktok?: string;
  pinterest?: string;
  facebook?: string;
  Category?: string;
  Country: string;
  "industry category": string;
  created_at?: string;
  updated_at?: string;
}

// Extract domain from URL for deduplication
function extractDomain(url?: string): string | null {
  if (!url) return null;
  
  try {
    const cleaned = url.trim().toLowerCase();
    const withProtocol = cleaned.startsWith('http://') || cleaned.startsWith('https://') 
      ? cleaned 
      : `https://${cleaned}`;
    
    const urlObj = new URL(withProtocol);
    let domain = urlObj.hostname;
    
    // Remove www. prefix
    domain = domain.replace(/^www\./, '');
    
    return domain;
  } catch {
    // If URL parsing fails, try basic extraction
    const cleaned = url.trim().toLowerCase();
    const withoutProtocol = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const domainPart = withoutProtocol.split('/')[0];
    return domainPart || null;
  }
}

// Calculate lead quality score for prioritization
function calculateLeadQualityScore(record: DatabaseLead): number {
  let score = 0;
  
  if (record.Emails && record.Emails.trim() !== '') score += 30;
  if (record.Phone && record.Phone.trim() !== '') score += 20;
  if (record.Website && record.Website.trim() !== '') score += 20;
  
  const socialCount = [
    record.instagram,
    record.youtube,
    record.linkedin,
    record.twitter,
    record.tiktok,
    record.pinterest,
    record.facebook,
  ].filter(Boolean).length;
  
  if (socialCount >= 3) score += 20;
  
  if (record.Name && record["industry category"] && record.Country) score += 10;
  
  return Math.min(score, 100);
}

// Transform database record to Lead type
function transformLead(record: DatabaseLead, category: string): Lead {
  // Split name into firstName and lastName
  const nameParts = (record.Name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const email = record.Emails || "";
  const locationParts = [record.Address, record.Country].filter(Boolean);
  const socialHandles = [
    record.instagram,
    record.youtube,
    record.linkedin,
    record.twitter,
    record.tiktok,
    record.pinterest,
    record.facebook,
  ].filter(Boolean);

  return {
    id: record.id || `${record.Name || "lead"}-${record.created_at || ""}-${record.Country || ""}`,
    firstName,
    lastName,
    email,
    company: record.Website || "Unknown Company",
    title: "Unknown",
    location: locationParts.length ? locationParts.join(", ") : "Unknown",
    companySize: "Unknown",
    industry: record["industry category"] || record.Category || category,
    website: record.Website,
    phone: record.Phone,
    openHours: undefined,
    socialMedia: socialHandles.length ? socialHandles.join(", ") : undefined,
    source: "database",
    matchedCriteria: [record.Country, record["industry category"] || record.Category || category].filter(
      (value): value is string => Boolean(value)
    ),
    matchQualityScore: 100,
  };
}

// Fisher-Yates shuffle algorithm for randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deduplicate leads by website domain, keeping the highest quality lead
function deduplicateByWebsite(records: DatabaseLead[]): DatabaseLead[] {
  const domainMap = new Map<string, DatabaseLead>();
  const noDomainLeads: DatabaseLead[] = [];
  
  for (const record of records) {
    const domain = extractDomain(record.Website);
    
    if (!domain) {
      noDomainLeads.push(record);
      continue;
    }
    
    const existing = domainMap.get(domain);
    if (!existing) {
      domainMap.set(domain, record);
    } else {
      const existingScore = calculateLeadQualityScore(existing);
      const currentScore = calculateLeadQualityScore(record);
      
      if (currentScore > existingScore) {
        domainMap.set(domain, record);
      }
    }
  }
  
  return [...domainMap.values(), ...noDomainLeads];
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitResult = rateLimiter.checkSearchLimit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitResult.error || "Too many requests",
          rateLimited: true 
        },
        { 
          status: 429,
          headers: rateLimitResult.retryAfter 
            ? { "Retry-After": rateLimitResult.retryAfter.toString() }
            : undefined
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "USA";
    const category = searchParams.get("category") || "Tech";

    // We intentionally do not support pagination here. The product requirement is:
    // max 10 leads per search, no pagination beyond this.
    const page = 1;

    console.log("[LEADS_SEARCH] Fetching leads", {
      country,
      category,
      page,
      note: "Pagination disabled: always returning up to 10 leads",
    });

    const pageSize = 10;
    // Fetch more records initially to account for deduplication
    const fetchSize = pageSize * 3;

    const query = supabase
      .from("leads")
      // Select only the columns we use (helps debug + avoids huge payloads)
      .select(
        `id,Name,Emails,Phone,Address,Website,instagram,youtube,linkedin,twitter,tiktok,pinterest,facebook,Category,Country,"industry category",created_at,updated_at`,
        { count: "exact" }
      )
      .eq("Country", country)
      .eq("industry category", category)
      .limit(fetchSize);

    console.log("[LEADS_SEARCH] Supabase query", {
      table: "leads",
      filters: {
        Country: country,
        "industry category": category,
      },
      limit: pageSize,
      selectedColumns: [
        "id",
        "Name",
        "Emails",
        "Phone",
        "Address",
        "Country",
        "Website",
        "Category",
        "industry category",
        "instagram",
        "youtube",
        "linkedin",
        "twitter",
        "tiktok",
        "pinterest",
        "facebook",
        "created_at",
        "updated_at",
      ],
    });

    const { data, count, error } = await query;

    if (error) {
      console.error("[LEADS_SEARCH] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    const totalCount = count || 0;

    // Since we do not paginate, we only report a single page. This keeps existing
    // client code stable while enforcing the 10-lead cap.
    const totalPages = totalCount > 0 ? 1 : 0;

    // Process records: deduplicate by website domain and randomize
    let records = (data || []) as DatabaseLead[];
    
    // Step 1: Deduplicate by website domain (keeps highest quality lead per domain)
    records = deduplicateByWebsite(records);
    
    // Step 2: Randomize the order
    records = shuffleArray(records);
    
    // Step 3: Limit to page size after deduplication
    records = records.slice(0, pageSize);
    
    // Transform database records to Lead type
    const leads: Lead[] = records.map((record) => transformLead(record, category));

    console.log("[LEADS_SEARCH] Processing results", {
      note: "Applied deduplication by website domain and randomization",
      originalCount: (data || []).length,
      afterDeduplication: records.length,
      finalCount: leads.length,
    });

    console.log("[LEADS_SEARCH] Email column mapping", {
      note: 'Fetching Supabase column "Emails" and mapping it to Lead.email',
      returned: leads.length,
      emails: leads.map((l) => l.email).filter(Boolean),
    });

    console.log("[LEADS_SEARCH] Supabase response", {
      totalCount,
      returned: leads.length,
      sample: records?.[0]
        ? {
            id: records[0].id,
            Name: records[0].Name,
            Emails: records[0].Emails,
            Country: records[0].Country,
            industryCategory: records[0]["industry category"],
          }
        : null,
    });

    return NextResponse.json({
      success: true,
      leads,
      totalCount,
      page,
      totalPages,
      pageSize,
      pagination: {
        enabled: false,
        reason: "Product requirement: max 10 leads per search and no pagination",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[LEADS_SEARCH] Error:", message);
    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
