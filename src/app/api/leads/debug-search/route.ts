import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import type { Lead } from "@/lib/lead-types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Database record type from Supabase
interface DatabaseLead {
  id?: string;
  Name?: string;
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
  const nameParts = (record.Name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const email = record.Emails || "";
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

/**
 * DEBUG ENDPOINT for diagnosing "Failed to fetch leads" errors
 * 
 * Usage: GET /api/leads/debug-search?country=USA&category=Tech
 * 
 * Returns comprehensive diagnostic information including:
 * - Environment configuration
 * - Received parameters
 * - Query construction details
 * - Raw Supabase response
 * - Transformed leads
 * - Any errors with full stack traces
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    endpoint: "/api/leads/debug-search",
    purpose: "Diagnose 'Failed to fetch leads' error",
  };

  try {
    // 1. Check environment variables
    diagnostics.environment = {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "MISSING",
      nodeEnv: process.env.NODE_ENV,
    };

    if (!supabaseUrl || !supabaseKey) {
      diagnostics.error = "Missing Supabase credentials";
      diagnostics.environment.critical = "SUPABASE_URL or SUPABASE_ANON_KEY not configured";
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // 2. Check authentication
    try {
      const { userId } = await auth();
      diagnostics.auth = {
        isAuthenticated: !!userId,
        userId: userId || "NOT_AUTHENTICATED",
      };

      if (!userId) {
        diagnostics.error = "User not authenticated";
        return NextResponse.json(diagnostics, { status: 401 });
      }
    } catch (authError) {
      diagnostics.auth = {
        error: authError instanceof Error ? authError.message : "Unknown auth error",
        stack: authError instanceof Error ? authError.stack : undefined,
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // 3. Parse request parameters
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "USA";
    const category = searchParams.get("category") || "Tech";

    diagnostics.parameters = {
      received: {
        country,
        category,
        fullUrl: request.url,
        searchParamsString: searchParams.toString(),
      },
    };

    // 4. Build Supabase query
    const supabase = createClient(supabaseUrl, supabaseKey);
    const pageSize = 10;

    diagnostics.query = {
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
        "City",
        "Country",
        "Website",
        "Company",
        "Title",
        "CompanySize",
        "Category",
        "industry category",
        "OpenHours",
        "SocialMedia",
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
    };

    // 5. Execute query
    let queryStartTime = Date.now();
    const query = supabase
      .from("leads")
      .select(
        `id, Name, Emails, Phone, Address, Website, instagram, youtube, linkedin, twitter, tiktok, pinterest, facebook, Category, Country, "industry category", created_at, updated_at, City, OpenHours, SocialMedia, CompanySize, Title, Company`,
        { count: "exact" }
      )
      .eq("Country", country)
      .eq("industry category", category)
      .limit(pageSize);

    const { data, count, error } = await query;
    const queryEndTime = Date.now();

    // Analyze column availability
    let columnAnalysis = null;
    if (data && data.length > 0) {
      const firstRecord = data[0] as any;
      const expectedColumns = [
        "id", "Name", "Emails", "Phone", "Address", "Website",
        "instagram", "youtube", "linkedin", "twitter", "tiktok",
        "pinterest", "facebook", "Category", "Country", "industry category",
        "City", "OpenHours", "SocialMedia", "CompanySize", "Title", "Company"
      ];
      
      columnAnalysis = {
        availableColumns: Object.keys(firstRecord),
        expectedColumns,
        missingColumns: expectedColumns.filter(col => !(col in firstRecord)),
        unexpectedColumns: Object.keys(firstRecord).filter(col => !expectedColumns.includes(col)),
        criticalColumnsPresent: {
          "Emails": "Emails" in firstRecord,
          "Name": "Name" in firstRecord,
          "Country": "Country" in firstRecord,
          "industry category": "industry category" in firstRecord,
        }
      };
    }

    diagnostics.supabaseResponse = {
      queryExecutionTime: `${queryEndTime - queryStartTime}ms`,
      hasError: !!error,
      error: error ? {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      } : null,
      dataType: typeof data,
      dataIsArray: Array.isArray(data),
      dataLength: data ? data.length : 0,
      count: count,
      rawDataSample: data && data.length > 0 ? data.slice(0, 2) : null,
      allData: data, // Include all raw data for debugging
      columnAnalysis,
    };

    if (error) {
      diagnostics.diagnosis = {
        issue: "Supabase query error",
        possibleCauses: [
          "Column names don't match database schema",
          "RLS (Row Level Security) policies blocking access",
          "Network connectivity issue",
          "Invalid credentials",
          "Database table doesn't exist",
        ],
        recommendation: "Check the error details above and verify database schema",
      };
      return NextResponse.json(diagnostics, { status: 400 });
    }

    // 6. Transform data
    try {
      const records = (data || []) as DatabaseLead[];
      const leads: Lead[] = records.map((record) => transformLead(record, category));

      diagnostics.transformation = {
        recordsReceived: records.length,
        leadsTransformed: leads.length,
        sampleTransformation: records[0] ? {
          original: records[0],
          transformed: leads[0],
        } : null,
        emailMapping: {
          note: "Mapping 'Emails' column to 'email' field",
          examples: leads.slice(0, 3).map(l => ({
            name: `${l.firstName} ${l.lastName}`,
            email: l.email,
            hasEmail: !!l.email,
          })),
        },
      };

      // 7. Final response structure
      diagnostics.finalResponse = {
        success: true,
        leads: leads,
        totalCount: count || 0,
        page: 1,
        totalPages: count && count > 0 ? 1 : 0,
        pageSize,
      };

      diagnostics.summary = {
        status: "SUCCESS",
        totalExecutionTime: `${Date.now() - startTime}ms`,
        leadsReturned: leads.length,
        noIssuesDetected: true,
        timing: {
          authTime: queryStartTime - startTime,
          queryTime: queryEndTime - queryStartTime,
          transformTime: Date.now() - queryEndTime,
          total: Date.now() - startTime,
        }
      };

      // Add comparison to regular endpoint
      diagnostics.comparisonWithRegularEndpoint = {
        note: "This debug endpoint returns the same data structure as /api/leads/search",
        differences: [
          "Debug endpoint does NOT apply rate limiting",
          "Debug endpoint returns ALL diagnostic information",
          "Debug endpoint includes raw Supabase data",
          "Debug endpoint shows column analysis"
        ],
        regularEndpointUrl: `/api/leads/search?country=${country}&category=${category}`,
      };

    } catch (transformError) {
      diagnostics.transformation = {
        error: transformError instanceof Error ? transformError.message : "Unknown transformation error",
        stack: transformError instanceof Error ? transformError.stack : undefined,
      };
      diagnostics.diagnosis = {
        issue: "Data transformation failed",
        possibleCauses: [
          "Unexpected data format from Supabase",
          "Null/undefined values causing errors",
          "Type mismatch in transformation logic",
        ],
      };
      return NextResponse.json(diagnostics, { status: 500 });
    }

  } catch (topLevelError) {
    diagnostics.criticalError = {
      message: topLevelError instanceof Error ? topLevelError.message : "Unknown error",
      stack: topLevelError instanceof Error ? topLevelError.stack : undefined,
      type: topLevelError instanceof Error ? topLevelError.constructor.name : typeof topLevelError,
    };
    diagnostics.summary = {
      status: "CRITICAL_FAILURE",
      totalExecutionTime: `${Date.now() - startTime}ms`,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Return full diagnostics
  diagnostics.summary.status = "COMPLETE";
  diagnostics.summary.totalExecutionTime = `${Date.now() - startTime}ms`;
  
  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
