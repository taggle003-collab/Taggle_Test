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
  id?: string;
  Name?: string;
  Emails?: string;
  Email?: string;
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
  Country?: string;
  "industry category"?: string;
  created_at?: string;
  updated_at?: string;
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
  const nameParts = (record.Name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const email = record.Emails || record.Email || "";
  const locationParts = [record.Address, record.City, record.Country].filter(Boolean);
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
    company: record.Company || record.Website || "Unknown Company",
    title: record.Title || "Unknown Title",
    location: locationParts.length ? locationParts.join(", ") : "Unknown",
    companySize: record.CompanySize || "Unknown",
    industry: record["industry category"] || record.Category || category,
    website: record.Website,
    phone: record.Phone,
    openHours: record.OpenHours,
    socialMedia: record.SocialMedia || (socialHandles.length ? socialHandles.join(", ") : undefined),
    source: "database",
    matchedCriteria: [record.Country, record["industry category"] || record.Category || category].filter(
      (value): value is string => Boolean(value)
    ),
    matchQualityScore: 100,
  };
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
    const page = parseInt(searchParams.get("page") || "1", 10);

    console.log("[LEADS_SEARCH] Fetching leads", {
      country,
      category,
      page,
    });

    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("Country", country)
      .eq("industry category", category)
      .range(offset, offset + pageSize - 1);

    console.log("[LEADS_SEARCH] Supabase query", {
      table: "leads",
      filters: {
        Country: country,
        "industry category": category,
      },
      range: {
        from: offset,
        to: offset + pageSize - 1,
      },
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
    const totalPages = Math.ceil(totalCount / pageSize);

    // Transform database records to Lead type
    const records = (data || []) as DatabaseLead[];
    const leads: Lead[] = records.map((record) => transformLead(record, category));

    console.log("[LEADS_SEARCH] Supabase response", {
      totalCount,
      returned: leads.length,
      sample: leads[0] || null,
    });

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
