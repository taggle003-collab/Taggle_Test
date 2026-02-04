import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
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
    
    let userId: string | null = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
      console.log("[SCRAPE_LEADS] Auth result:", { userId: userId ? "present" : "null" });
    } catch (authError: unknown) {
      const err = authError as {
        message?: string;
        status?: number;
        code?: string;
        type?: string;
        stack?: string;
      };
      console.error("[SCRAPE_AUTH_ERROR]", {
        message: err.message,
        status: err.status,
        code: err.code,
        type: err.type,
        stack: err.stack
      });

      return NextResponse.json(
        {
          error: "Authentication failed",
          message: "Authentication failed. Please sign in again.",
          details: err.message,
          clerkError: true,
          code: err.code || "auth_failed",
          status: err.status || 422
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

    let clerkClientInstance: Awaited<ReturnType<typeof clerkClient>> | null = null;
    let user: { unsafeMetadata: Record<string, unknown> } | null = null;
    let metadata: Record<string, unknown> = {};

    try {
      clerkClientInstance = await clerkClient();
      console.log("[SCRAPE_LEADS] Clerk client created, fetching user...");

      user = await clerkClientInstance.users.getUser(userId);
      console.log("[SCRAPE_LEADS] User fetched successfully");
      
      metadata = user.unsafeMetadata || {};
      console.log("[SCRAPE_LEADS] User metadata keys:", Object.keys(metadata));
      console.log("[SCRAPE_LEADS] User metadata values (safe):", {
        hasPlan: 'plan' in metadata,
        hasSearchCount: 'searchCount' in metadata,
        hasPreviousLeads: 'previousLeads' in metadata,
        hasRateLimitResetTime: 'rateLimitResetTime' in metadata,
        hasLeadsUsed: 'leadsUsed' in metadata,
        hasTotalLeads: 'totalLeads' in metadata,
        hasTrialStartedAt: 'trialStartedAt' in metadata
      });
    } catch (userError: unknown) {
      const err = userError as { message?: string; status?: number; code?: string; details?: unknown };
      console.error("[SCRAPE_USER_ERROR]", {
        message: err.message,
        status: err.status,
        code: err.code,
        details: err.details
      });
      
      return NextResponse.json(
        { 
          error: "Failed to fetch user data", 
          message: "Could not retrieve user information. Please try again.",
          details: err.message,
          clerkError: true,
          code: err.code || "user_fetch_failed"
        },
        { status: 422 }
      );
    }
    
    // Rate Limiting Logic
    const now = new Date();
    const searchLimit = 3;
    const oneHour = 60 * 60 * 1000;
    
    // Detect metadata format and initialize missing fields
    const hasRateLimitingFields = 'searchCount' in metadata || 'previousLeads' in metadata || 'rateLimitResetTime' in metadata;
    const hasOldPlanFields = 'plan' in metadata || 'leadsUsed' in metadata || 'totalLeads' in metadata || 'trialStartedAt' in metadata;
    
    // Log metadata compatibility status
    console.log("[SCRAPE_LEADS] Metadata compatibility:", {
      hasRateLimitingFields,
      hasOldPlanFields,
      metadataKeys: Object.keys(metadata),
      userId: userId.substring(0, 8)
    });
    
    // Initialize rate limiting fields if missing (backward compatibility)
    let searchCount = typeof metadata.searchCount === 'number' ? metadata.searchCount : 0;
    let lastSearchTime = metadata.lastSearchTime ? new Date(metadata.lastSearchTime as string) : null;
    let resetTime = metadata.rateLimitResetTime ? new Date(metadata.rateLimitResetTime as string) : null;
    
    // Handle migration from old metadata format
    if (!hasRateLimitingFields && hasOldPlanFields) {
      console.log("[SCRAPE_LEADS] Migrating from old metadata format to rate limiting format");
      searchCount = 0;
      lastSearchTime = null;
      resetTime = null;
    }
    
    // Reset if it's been more than an hour since the reset time or first search
    if (resetTime && now > resetTime) {
      console.log("[SCRAPE_LEADS] Resetting search count - rate limit window expired");
      searchCount = 0;
      resetTime = null;
    } else if (lastSearchTime && (now.getTime() - lastSearchTime.getTime() > oneHour)) {
      console.log("[SCRAPE_LEADS] Resetting search count - hour elapsed since last search");
      searchCount = 0;
      resetTime = null;
    }

    if (searchCount >= searchLimit) {
      const actualResetTime = resetTime || new Date(now.getTime() + oneHour);
      
      console.log("[SCRAPE_LEADS] Rate limit exceeded:", {
        searchCount,
        searchLimit,
        resetTime: actualResetTime.toISOString()
      });
      
      // Update reset time if not set
      if (!resetTime) {
        try {
          const resetMetadata: Record<string, unknown> = {
            ...metadata,
            // Preserve all existing fields
            plan: metadata.plan,
            billingCycle: metadata.billingCycle,
            productId: metadata.productId,
            orderId: metadata.orderId,
            purchaseDate: metadata.purchaseDate,
            trialStartedAt: metadata.trialStartedAt,
            leadsUsed: metadata.leadsUsed,
            totalLeads: metadata.totalLeads,
            searchCount: metadata.searchCount,
            lastSearchTime: metadata.lastSearchTime,
            previousLeads: metadata.previousLeads,
            // Add reset time
            rateLimitResetTime: actualResetTime.toISOString()
          };
          
          await clerkClientInstance.users.updateUser(userId, {
            unsafeMetadata: resetMetadata
          });
          console.log("[SCRAPE_LEADS] Updated rate limit reset time - all fields preserved");
        } catch (updateError: unknown) {
          const err = updateError as { message?: string; status?: number; code?: string };
          console.error("[SCRAPE_UPDATE_ERROR]", {
            message: err.message,
            status: err.status,
            code: err.code
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

    console.log("[SCRAPE_LEADS] Rate limit check passed, parsing request body...");
    
    let body: unknown;
    try {
      body = await req.json();
      console.log("[SCRAPE_LEADS] Request body parsed successfully, type:", typeof body);
    } catch (parseError: unknown) {
      const err = parseError as { message?: string };
      console.error("[SCRAPE_LEADS] Failed to parse request body:", err.message);
      return NextResponse.json(
        { 
          error: "Invalid JSON", 
          message: "The request body contains invalid JSON.",
          details: err.message
        },
        { status: 400 }
      );
    }
    
    // Validate that body is an object and not null
    if (!body || typeof body !== 'object') {
      console.error("[SCRAPE_LEADS] Invalid request body type:", typeof body, "value:", body);
      return NextResponse.json(
        { 
          error: "Invalid request body", 
          message: "The request body is invalid.",
          details: "Request body must be valid JSON object"
        },
        { status: 400 }
      );
    }
    
    const { page = 1, limit = 20, ...criteria } = body as Record<string, unknown>;
    
    console.log("[SCRAPE_LEADS] Extracted parameters:", { page, limit, criteriaKeys: Object.keys(criteria) });
    
    // Validate pagination parameters
    const pageNum = Number(page);
    const limitNum = Number(limit);
    
    console.log("[SCRAPE_LEADS] Converted to numbers:", { pageNum, limitNum, pageIsNaN: isNaN(pageNum), limitIsNaN: isNaN(limitNum) });
    
    if (isNaN(pageNum) || pageNum < 1) {
      console.error("[SCRAPE_LEADS] Invalid page parameter:", { page, pageNum, isNaN: isNaN(pageNum), lessThan1: pageNum < 1 });
      return NextResponse.json(
        { 
          error: "Invalid page parameter", 
          message: "Invalid page number.",
          details: `Page must be a positive number. Received: ${page} (type: ${typeof page})` 
        },
        { status: 400 }
      );
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.error("[SCRAPE_LEADS] Invalid limit parameter:", { limit, limitNum, isNaN: isNaN(limitNum), lessThan1: limitNum < 1, greaterThan100: limitNum > 100 });
      return NextResponse.json(
        { 
          error: "Invalid limit parameter", 
          message: "Invalid limit value.",
          details: `Limit must be between 1 and 100. Received: ${limit} (type: ${typeof limit})` 
        },
        { status: 400 }
      );
    }
    
    console.log("[SCRAPE_LEADS] Validation passed, processing request:", { 
      page: pageNum, 
      limit: limitNum, 
      criteriaKeys: Object.keys(criteria),
      hasCustomICP: !!criteria.customICP 
    });

    // Previously scraped leads to ensure uniqueness
    const previousLeads = new Set<string>(Array.isArray(metadata.previousLeads) ? metadata.previousLeads : []);
    
    console.log("[SCRAPE_LEADS] Previous leads count:", previousLeads.size);

    // Determine if user has advanced matching (Solo or Pro plan)
    const userPlan = metadata.plan as string | undefined;
    const isAdvancedMatching = userPlan === "solo" || userPlan === "pro";
    
    console.log("[SCRAPE_LEADS] User plan:", userPlan || "not set", "Advanced matching:", isAdvancedMatching);

    // Ensure clerkClientInstance is not null before proceeding
    if (!clerkClientInstance) {
      console.error("[SCRAPE_LEADS] Clerk client instance is null, cannot proceed");
      return NextResponse.json(
        { 
          error: "Internal server error", 
          message: "Failed to initialize Clerk client.",
          details: "Clerk client instance is not available"
        },
        { status: 500 }
      );
    }

    // Generate a larger set of leads (e.g., 100-120) for pagination
    const totalLeadsToGenerate = 120;

    console.log("[SCRAPE_LEADS] Starting real scraping with orchestrator...", {
      totalToGenerate: totalLeadsToGenerate,
      previousLeadsCount: previousLeads.size,
      isAdvancedMatching
    });
    
    // Use the real scraping orchestrator
    let scrapingResult;
    try {
      scrapingResult = await leadScraper.scrapeLeads(
        criteria as ICPCriteria,
        totalLeadsToGenerate,
        previousLeads,
        isAdvancedMatching
      );
      console.log("[SCRAPE_LEADS] Scraping orchestrator completed successfully");
    } catch (scrapeError: unknown) {
      const err = scrapeError as { message?: string; stack?: string };
      console.error("[SCRAPE_LEADS] Scraping orchestrator failed:", {
        message: err.message,
        stack: err.stack
      });
      return NextResponse.json(
        { 
          error: "Scraping failed", 
          message: "Failed to scrape leads. Please try again.",
          details: err.message
        },
        { status: 500 }
      );
    }
    
    // Convert scraped leads to legacy Lead format
    const allLeads = scrapingResult.leads.map(convertScrapedLeadToLead);
    
    console.log(`[SCRAPE_LEADS] Real scraping complete. Found ${allLeads.length} leads from ${scrapingResult.sources.length} sources`);
    if (scrapingResult.errors.length > 0) {
      console.log("[SCRAPE_LEADS] Scraping errors:", scrapingResult.errors);
    }
    
    if (allLeads.length === 0) {
      console.log("[SCRAPE_LEADS] No leads found, returning empty result");
      return NextResponse.json({ 
        leads: [],
        pagination: { page: 1, limit: limitNum, total: 0, pages: 0 },
        searchesRemaining: searchLimit - searchCount
      });
    }

    // Update user metadata with new search count and used leads
    const newSearchCount = searchCount + 1;
    const newPreviousLeads = Array.from(new Set([...Array.from(previousLeads), ...allLeads.map(l => l.email)]));
    
    // Limit previousLeads size to avoid Clerk metadata limits (keeping last 500)
    const trimmedPreviousLeads = newPreviousLeads.slice(-500);
    
    // Build updated metadata - preserve all existing fields and add rate limiting fields
    const updatedMetadata: Record<string, unknown> = {
      ...metadata,
      // Preserve old plan fields
      plan: metadata.plan,
      billingCycle: metadata.billingCycle,
      productId: metadata.productId,
      orderId: metadata.orderId,
      purchaseDate: metadata.purchaseDate,
      trialStartedAt: metadata.trialStartedAt,
      leadsUsed: metadata.leadsUsed,
      totalLeads: metadata.totalLeads,
      // Add/update rate limiting fields
      searchCount: newSearchCount,
      lastSearchTime: now.toISOString(),
      previousLeads: trimmedPreviousLeads,
      rateLimitResetTime: newSearchCount >= searchLimit ? new Date(now.getTime() + oneHour).toISOString() : null
    };
    
    console.log("[SCRAPE_LEADS] Updating metadata:", {
      searchCount: newSearchCount,
      previousLeadsCount: trimmedPreviousLeads.length,
      preservedFields: Object.keys(metadata).length,
      rateLimited: newSearchCount >= searchLimit
    });

    try {
      await clerkClientInstance.users.updateUser(userId, {
        unsafeMetadata: updatedMetadata
      });
      console.log("[SCRAPE_LEADS] Successfully updated user metadata - all fields preserved");
    } catch (updateError: unknown) {
      const err = updateError as { message?: string; status?: number; code?: string; details?: unknown };
      console.error("[SCRAPE_UPDATE_METADATA_ERROR]", {
        message: err.message,
        status: err.status,
        code: err.code,
        details: err.details,
        metadataSize: JSON.stringify(updatedMetadata).length
      });
      
      // Don't fail the entire request if metadata update fails
      // The user still gets their leads
      console.log("[SCRAPE_LEADS] Metadata update failed but returning leads to user");
    }

    console.log("[SCRAPE_LEADS] Request completed successfully:", {
      leadsGenerated: allLeads.length,
      searchesRemaining: searchLimit - newSearchCount,
      totalPreviousLeads: trimmedPreviousLeads.length,
      userPlan: userPlan || "not set"
    });

    const responseData = { 
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
    };

    console.log("[SCRAPE_LEADS] Returning response with:", {
      leadsCount: responseData.leads.length,
      paginationTotal: responseData.pagination.total,
      searchesRemaining: responseData.searchesRemaining,
      hasRateLimitReset: !!responseData.rateLimitReset
    });

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      status?: number;
      code?: string;
      type?: string;
      details?: unknown;
      stack?: string;
      name?: string;
      clerkError?: boolean;
    };

    console.error("[SCRAPE_ERROR]", {
      message: err.message,
      status: err.status,
      code: err.code,
      type: err.type,
      details: err.details,
      stack: err.stack,
      name: err.name
    });

    // Check if it's a Clerk error
    if (err.clerkError || err.status === 422) {
      return NextResponse.json(
        {
          error: "Clerk authentication error",
          message: "Authentication with Clerk failed.",
          details: err.message,
          clerkError: true,
          code: err.code || "clerk_error",
          status: err.status || 422
        },
        { status: err.status || 422 }
      );
    }

    // Generic error handling
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Something went wrong on our server. Please try again later.",
        details: err.message,
        type: err.name || "UnknownError"
      },
      { status: 500 }
    );
  }
}
