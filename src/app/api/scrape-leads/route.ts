import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { leadScraper } from "@/lib/scrapers/orchestrator";
import { ScrapedLead } from "@/lib/scrapers/base-scraper";

// Type definitions
type LocationKey = 'USA' | 'India' | 'UK' | 'Europe' | 'Canada' | 'Australia' | 'Japan' | 'Singapore' | 'Dubai' | 'Asia';

interface ICPCriteria {
  location?: string;
  industry?: string;
  companySize?: string;
  jobTitles?: string[];
  customICP?: string;
  annualRevenue?: string;
  fundingStage?: string;
  qualityScore?: number;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  linkedInProfile: string;
  verified: boolean;
  accuracy: number;
  founderName: string;
  founderTitle: string;
  founderImage: string;
  fundingStage?: string;
  annualRevenue?: string;
  matchQualityScore?: number;
  matchedCriteria?: string[];
  source: string;
  sourceUrl?: string;
}

// Convert ScrapedLead to Lead interface for compatibility
function convertScrapedLeadToLead(scrapedLead: ScrapedLead): Lead {
  return {
    id: scrapedLead.id,
    firstName: scrapedLead.firstName,
    lastName: scrapedLead.lastName,
    email: scrapedLead.email,
    company: scrapedLead.company,
    title: scrapedLead.title,
    location: scrapedLead.location,
    companySize: scrapedLead.companySize,
    industry: scrapedLead.industry,
    linkedInProfile: scrapedLead.linkedInProfile || `https://linkedin.com/in/${scrapedLead.firstName.toLowerCase()}-${scrapedLead.lastName.toLowerCase()}`,
    verified: scrapedLead.verified || false,
    accuracy: scrapedLead.accuracy || Math.min((scrapedLead.matchQualityScore || 80) + 5, 95),
    founderName: scrapedLead.founderName || `${scrapedLead.firstName} ${scrapedLead.lastName}`,
    founderTitle: scrapedLead.founderTitle || scrapedLead.title,
    founderImage: scrapedLead.founderImage || `https://i.pravatar.cc/150?u=${scrapedLead.company.toLowerCase()}`,
    fundingStage: scrapedLead.fundingStage,
    annualRevenue: scrapedLead.annualRevenue,
    matchQualityScore: scrapedLead.matchQualityScore,
    matchedCriteria: scrapedLead.matchedCriteria,
    source: scrapedLead.source,
    sourceUrl: scrapedLead.sourceUrl
  };
}

export async function POST(req: Request) {
  try {
    console.log("[SCRAPE_LEADS] Starting request...");
    console.log("[SCRAPE_LEADS] Request headers:", Object.fromEntries(req.headers.entries()));
    
    let userId: string | null = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
      console.log("[SCRAPE_LEADS] Auth result:", { userId: userId ? "present" : "null" });
    } catch (authError: any) {
      console.error("[SCRAPE_AUTH_ERROR]", {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        type: authError.type,
        stack: authError.stack
      });
      
      return NextResponse.json(
        { 
          error: "Authentication failed", 
          message: "Authentication failed. Please sign in again.",
          details: authError.message,
          clerkError: true,
          code: authError.code || "auth_failed",
          status: authError.status || 422
        },
        { status: 422 }
      );
    }
    
    if (!userId) {
      console.log("[SCRAPE_LEADS] No userId found, returning 401");
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication error. Please sign in again." },
        { status: 401 }
      );
    }

    console.log("[SCRAPE_LEADS] Getting Clerk client for user:", userId);
    
    let client: any;
    let user: any;
    let metadata: any = {};
    
    try {
      client = await clerkClient();
      console.log("[SCRAPE_LEADS] Clerk client created, fetching user...");
      
      user = await client.users.getUser(userId);
      console.log("[SCRAPE_LEADS] User fetched successfully");
      
      metadata = (user.unsafeMetadata as any) || {};
      console.log("[SCRAPE_LEADS] User metadata:", Object.keys(metadata));
    } catch (userError: any) {
      console.error("[SCRAPE_USER_ERROR]", {
        message: userError.message,
        status: userError.status,
        code: userError.code,
        details: userError.details
      });
      
      return NextResponse.json(
        { 
          error: "Failed to fetch user data", 
          message: "Could not retrieve user information. Please try again.",
          details: userError.message,
          clerkError: true,
          code: userError.code || "user_fetch_failed"
        },
        { status: 422 }
      );
    }
    
    // Rate Limiting Logic
    const now = new Date();
    const searchLimit = 3;
    const oneHour = 60 * 60 * 1000;
    
    let searchCount = metadata.searchCount || 0;
    let lastSearchTime = metadata.lastSearchTime ? new Date(metadata.lastSearchTime) : null;
    let resetTime = metadata.rateLimitResetTime ? new Date(metadata.rateLimitResetTime) : null;
    
    // Reset if it's been more than an hour since the reset time or first search
    if (resetTime && now > resetTime) {
      searchCount = 0;
      resetTime = null;
    } else if (lastSearchTime && (now.getTime() - lastSearchTime.getTime() > oneHour)) {
      searchCount = 0;
      resetTime = null;
    }

    if (searchCount >= searchLimit) {
      const actualResetTime = resetTime || new Date(now.getTime() + oneHour);
      
      // Update reset time if not set
      if (!resetTime) {
        try {
          await client.users.updateUser(userId, {
            unsafeMetadata: {
              ...metadata,
              rateLimitResetTime: actualResetTime.toISOString()
            }
          });
          console.log("[SCRAPE_LEADS] Updated rate limit reset time");
        } catch (updateError: any) {
          console.error("[SCRAPE_UPDATE_ERROR]", {
            message: updateError.message,
            status: updateError.status,
            code: updateError.code
          });
        }
      }

      const retryAfter = Math.ceil((actualResetTime.getTime() - now.getTime()) / 1000);
      
      return NextResponse.json({
        error: "Rate limit exceeded",
        message: `You've used ${searchLimit} searches. Try again in 1 hour.`,
        resetTime: actualResetTime.toISOString(),
        retryAfter
      }, { status: 429 });
    }

    const body = await req.json();
    
    // Validate that body is an object and not null
    if (!body || typeof body !== 'object') {
      console.error("[SCRAPE_LEADS] Invalid request body:", body);
      return NextResponse.json(
        { 
          error: "Invalid request body", 
          message: "The request body is invalid.",
          details: "Request body must be valid JSON object"
        },
        { status: 400 }
      );
    }
    
    const { page = 1, limit = 20, ...criteria } = body;
    
    // Validate pagination parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json(
        { 
          error: "Invalid page parameter", 
          message: "Invalid page number.",
          details: "Page must be a positive number" 
        },
        { status: 400 }
      );
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return NextResponse.json(
        { 
          error: "Invalid limit parameter", 
          message: "Invalid limit value.",
          details: "Limit must be between 1 and 100" 
        },
        { status: 400 }
      );
    }
    
    console.log("[SCRAPE_LEADS] Request body parsed:", { 
      page: pageNum, 
      limit: limitNum, 
      criteriaKeys: Object.keys(criteria),
      hasCustomICP: !!criteria.customICP 
    });

    // Previously scraped leads to ensure uniqueness
    const previousLeads = new Set<string>(metadata.previousLeads || []);

    // Determine if user has advanced matching (Solo or Pro plan)
    const userPlan = metadata.plan as string | undefined;
    const isAdvancedMatching = userPlan === "solo" || userPlan === "pro";

    // Generate a larger set of leads (e.g., 100-120) for pagination
    const totalLeadsToGenerate = 120;

    console.log("[SCRAPE_LEADS] Starting real scraping with orchestrator...");
    
    // Use the real scraping orchestrator
    const scrapingResult = await leadScraper.scrapeLeads(
      criteria as ICPCriteria,
      totalLeadsToGenerate,
      previousLeads,
      isAdvancedMatching
    );
    
    // Convert scraped leads to legacy Lead format
    const allLeads = scrapingResult.leads.map(convertScrapedLeadToLead);
    
    console.log(`[SCRAPE_LEADS] Real scraping complete. Found ${allLeads.length} leads from ${scrapingResult.sources.length} sources`);
    if (scrapingResult.errors.length > 0) {
      console.log("[SCRAPE_LEADS] Scraping errors:", scrapingResult.errors);
    }
    
    if (allLeads.length === 0) {
      return NextResponse.json({ 
        leads: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        searchesRemaining: searchLimit - searchCount
      });
    }

    // Update user metadata with new search count and used leads
    const newSearchCount = searchCount + 1;
    const newPreviousLeads = Array.from(new Set([...Array.from(previousLeads), ...allLeads.map(l => l.email)]));
    
    // Limit previousLeads size to avoid Clerk metadata limits (keeping last 500)
    const trimmedPreviousLeads = newPreviousLeads.slice(-500);

    try {
      await client.users.updateUser(userId, {
        unsafeMetadata: {
          ...metadata,
          searchCount: newSearchCount,
          lastSearchTime: now.toISOString(),
          previousLeads: trimmedPreviousLeads,
          rateLimitResetTime: newSearchCount >= searchLimit ? new Date(now.getTime() + oneHour).toISOString() : null
        }
      });
      console.log("[SCRAPE_LEADS] Successfully updated user metadata");
    } catch (updateError: any) {
      console.error("[SCRAPE_UPDATE_METADATA_ERROR]", {
        message: updateError.message,
        status: updateError.status,
        code: updateError.code,
        details: updateError.details
      });
      
      // Don't fail the entire request if metadata update fails
      // The user still gets their leads
    }

    // Calculate pagination
    const totalPages = Math.ceil(allLeads.length / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedLeads = allLeads.slice(startIndex, endIndex);

    return NextResponse.json({ 
      leads: allLeads, // Return all leads for client-side pagination as per current implementation
      pagination: {
        page: 1,
        limit: limitNum,
        total: allLeads.length,
        pages: Math.ceil(allLeads.length / limitNum),
        hasNext: allLeads.length > limitNum,
        hasPrev: false
      },
      quality: "verified_active",
      searchesRemaining: searchLimit - newSearchCount,
      rateLimitReset: newSearchCount >= searchLimit ? new Date(now.getTime() + oneHour).toISOString() : null
    });
  } catch (error: any) {
    console.error("[SCRAPE_ERROR]", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      details: error.details,
      stack: error.stack,
      name: error.name
    });
    
    // Check if it's a Clerk error
    if (error.clerkError || error.status === 422) {
      return NextResponse.json(
        { 
          error: "Clerk authentication error", 
          message: "Authentication with Clerk failed.",
          details: error.message,
          clerkError: true,
          code: error.code || "clerk_error",
          status: error.status || 422
        },
        { status: error.status || 422 }
      );
    }
    
    // Generic error handling
    return NextResponse.json(
      { 
        error: "Internal server error", 
        message: "Something went wrong on our server. Please try again later.",
        details: error.message,
        type: error.name || "UnknownError"
      },
      { status: 500 }
    );
  }
}
