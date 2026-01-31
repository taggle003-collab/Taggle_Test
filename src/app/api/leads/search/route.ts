import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Lead } from "@/lib/lead-types";

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
  Email?: string;
  Phone?: string;
  Website?: string;
  Country: string;
  Category: string;
  "industry category"?: string;
  City?: string;
  OpenHours?: string;
  SocialMedia?: string;
  CompanySize?: string;
  Title?: string;
  Company?: string;
}

// Transform database record to Lead type
function transformLead(record: DatabaseLead, category: string): Lead {
  // Split name into firstName and lastName
  const nameParts = (record.Name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    id: record.id,
    firstName,
    lastName,
    email: record.Email || '',
    company: record.Company || record.Website || 'Unknown Company',
    title: record.Title || 'Unknown Title',
    location: record.City ? `${record.City}, ${record.Country}` : record.Country,
    companySize: record.CompanySize || 'Unknown',
    industry: record["industry category"] || record.Category || category,
    website: record.Website,
    phone: record.Phone,
    openHours: record.OpenHours,
    socialMedia: record.SocialMedia,
    source: 'database',
    matchedCriteria: [record.Country, record["industry category"] || record.Category || category].filter(Boolean),
    matchQualityScore: 100,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "USA";
    const category = searchParams.get("category") || "Tech";
    const page = parseInt(searchParams.get("page") || "1", 10);

    console.log(`[LEADS_SEARCH] Fetching: country=${country}, category=${category}, page=${page}`);

    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("Country", country)
      .eq("industry category", category)
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("[LEADS_SEARCH] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Transform database records to Lead type
    const leads: Lead[] = (data || []).map((record: any) => transformLead(record as DatabaseLead, category));

    console.log(`[LEADS_SEARCH] Found ${totalCount} total leads, returning ${leads.length}`);

    return NextResponse.json({
      success: true,
      leads,
      totalCount,
      page,
      totalPages,
      pageSize,
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
