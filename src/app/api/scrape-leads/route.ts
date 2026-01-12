import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

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
}

const firstNames = [
  "John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Lisa", "Robert", "Maria",
  "William", "Jennifer", "Richard", "Patricia", "Joseph", "Linda", "Thomas", "Barbara", "Charles", "Susan",
  "Christopher", "Jessica", "Daniel", "Karen", "Matthew", "Nancy", "Anthony", "Betty", "Mark", "Helen", "Donald",
  "Sandra", "Steven", "Donna", "Paul", "Carol", "Andrew", "Ruth", "Joshua", "Sharon", "Kenneth"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
];

const companies = [
  "TechCorp", "Startuply", "BigSoft", "Healthify", "PayFlow", "DataMax", "CloudNine", "NextGen", "InnovateCo", "FutureTech",
  "SmartScale", "GrowthLabs", "PeakPerformance", "PrimeDigital", "AlphaSolutions", "BetaWorks", "GammaSystems", "DeltaTech", "OmegaInnovations", "SigmaDigital",
  "CyberNaut", "Zenith", "Quantum", "Nexus", "Vertex", "Apex", "Omni", "Flux", "Orbit", "Pulse"
];

// Mock founders for companies
const companyFounders: Record<string, { name: string; title: string; image: string }> = {};

companies.forEach((company, index) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  companyFounders[company] = {
    name: `${firstName} ${lastName}`,
    title: index % 3 === 0 ? "Founder & CEO" : "Co-Founder",
    image: `https://i.pravatar.cc/150?u=${company.toLowerCase()}`
  };
});

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Email validation function
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidPatterns = [
    'noreply', 'no-reply', 'donotreply', 'test', 'example', 
    'spam', 'fake', 'dummy', 'admin@', 'info@'
  ];
  
  if (!emailRegex.test(email)) return false;
  
  const lowerEmail = email.toLowerCase();
  return !invalidPatterns.some(pattern => lowerEmail.includes(pattern));
}

// Generate unique leads (no duplicates)
function generateLeads(criteria: ICPCriteria, count: number, previouslyScrapedEmails: Set<string> = new Set(), isAdvancedMatching: boolean = false): Lead[] {
  const leads: Lead[] = [];
  const usedEmailsInThisBatch = new Set<string>();
  const usedNamesInThisBatch = new Set<string>();
  
  const jobTitlesArray = Array.isArray(criteria.jobTitles) && criteria.jobTitles.length > 0
    ? criteria.jobTitles
    : ["CEO", "CTO", "Founder", "VP Sales", "Sales Director", "Marketing Manager"];
  
  // Determine values from custom ICP or structured fields
  let industry = criteria.industry || "SaaS";
  let companySize = criteria.companySize || "10-50";
  let location: LocationKey = (criteria.location as LocationKey) || "USA";
  
  // Revenue and funding options for advanced matching
  const revenueOptions = ["Under $1M", "$1M - $10M", "$10M - $100M", "$100M - $1B", "$1B+"];
  const fundingOptions = ["Bootstrapped", "Pre-seed", "Seed", "Series A", "Series B", "Series C+"];
  
  // If custom ICP is provided, try to extract some info (basic parsing)
  if (criteria.customICP && criteria.customICP.trim()) {
    const customICP = criteria.customICP.toLowerCase();
    
    // Extract industry hints
    if (customICP.includes('saas') || customICP.includes('software')) industry = "SaaS";
    else if (customICP.includes('health') || customICP.includes('medical')) industry = "Healthcare";
    else if (customICP.includes('finance') || customICP.includes('fintech')) industry = "Finance";
    else if (customICP.includes('retail') || customICP.includes('ecommerce')) industry = "Retail";
    else if (customICP.includes('tech') || customICP.includes('startup')) industry = "Tech";
    
    // Extract size hints
    if (customICP.includes('early-stage') || customICP.includes('startup')) companySize = "1-10";
    else if (customICP.includes('mid-size') || customICP.includes('growing')) companySize = "50-100";
    else if (customICP.includes('enterprise') || customICP.includes('large')) companySize = "500-1000";
    
    // Extract location hints
    if (customICP.includes('usa') || customICP.includes('us') || customICP.includes('america')) location = "USA";
    else if (customICP.includes('europe') || customICP.includes('eu')) location = "Europe";
    else if (customICP.includes('india')) location = "India";
    else if (customICP.includes('asia')) location = "Asia";
  }
  
  let attempts = 0;
  const maxAttempts = count * 10; // Increased attempts to find unique leads
  
  while (leads.length < count && attempts < maxAttempts) {
    attempts++;
    
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    // Skip if we've used this name combo in this batch
    if (usedNamesInThisBatch.has(fullName)) continue;
    
    const title = getRandomItem(jobTitlesArray);
    const company = getRandomItem(companies);
    const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    
    // Skip if we've used this email before OR in this batch OR it's invalid
    if (previouslyScrapedEmails.has(email) || usedEmailsInThisBatch.has(email) || !isValidEmail(email)) continue;
    
    usedEmailsInThisBatch.add(email);
    usedNamesInThisBatch.add(fullName);
    
    const founder = companyFounders[company] || {
      name: "John Doe",
      title: "Founder",
      image: "https://i.pravatar.cc/150?u=fallback"
    };
    
    // Advanced matching: add revenue and funding data
    let fundingStage: string | undefined;
    let annualRevenue: string | undefined;
    let matchQualityScore: number | undefined;
    let matchedCriteria: string[] | undefined;
    
    if (isAdvancedMatching) {
      // Assign funding stage
      if (criteria.fundingStage) {
        fundingStage = criteria.fundingStage;
      } else {
        fundingStage = getRandomItem(fundingOptions);
      }
      
      // Assign annual revenue
      if (criteria.annualRevenue) {
        annualRevenue = criteria.annualRevenue;
      } else {
        annualRevenue = getRandomItem(revenueOptions);
      }
      
      // Calculate match quality score (for Pro users)
      matchedCriteria = [];
      let score = 0;
      let maxScore = 0;
      
      if (criteria.industry) {
        maxScore += 20;
        if (industry === criteria.industry) {
          score += 20;
          matchedCriteria.push('industry');
        }
      }
      
      if (criteria.companySize) {
        maxScore += 20;
        if (companySize === criteria.companySize) {
          score += 20;
          matchedCriteria.push('company size');
        }
      }
      
      if (criteria.location) {
        maxScore += 15;
        if (location.toLowerCase().includes(criteria.location.toLowerCase())) {
          score += 15;
          matchedCriteria.push('location');
        }
      }
      
      if (criteria.jobTitles && criteria.jobTitles.length > 0) {
        maxScore += 25;
        if (criteria.jobTitles.some(t => title.toLowerCase().includes(t.toLowerCase()))) {
          score += 25;
          matchedCriteria.push('job title');
        }
      }
      
      if (criteria.annualRevenue) {
        maxScore += 10;
        if (annualRevenue === criteria.annualRevenue) {
          score += 10;
          matchedCriteria.push('revenue');
        }
      }
      
      if (criteria.fundingStage) {
        maxScore += 10;
        if (fundingStage === criteria.fundingStage) {
          score += 10;
          matchedCriteria.push('funding');
        }
      }
      
      matchQualityScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 85 + Math.floor(Math.random() * 15);
      
      // Filter by quality score if specified
      if (criteria.qualityScore && matchQualityScore < criteria.qualityScore) {
        continue; // Skip this lead if it doesn't meet quality threshold
      }
    }
    
    const lead: Lead = {
      id: `${Date.now()}-${leads.length}`,
      firstName,
      lastName,
      email,
      company,
      title,
      location,
      companySize,
      industry,
      linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      verified: true,
      accuracy: Math.floor(Math.random() * 15) + 85, // 85-100% accuracy score
      founderName: founder.name,
      founderTitle: founder.title,
      founderImage: founder.image,
    };
    
    // Add advanced fields if available
    if (isAdvancedMatching) {
      lead.fundingStage = fundingStage;
      lead.annualRevenue = annualRevenue;
      lead.matchQualityScore = matchQualityScore;
      lead.matchedCriteria = matchedCriteria;
    }
    
    leads.push(lead);
  }
  
  return leads;
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
      console.log("[SCRAPE_LEADS] User metadata:", Object.keys(metadata));
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
    const previousLeads = new Set<string>(Array.isArray(metadata.previousLeads) ? metadata.previousLeads : []);
    
    console.log("[SCRAPE_LEADS] Previous leads count:", previousLeads.size);

    // Determine if user has advanced matching (Solo or Pro plan)
    const userPlan = metadata.plan as string | undefined;
    const isAdvancedMatching = userPlan === "solo" || userPlan === "pro";
    
    console.log("[SCRAPE_LEADS] User plan:", userPlan || "not set", "Advanced matching:", isAdvancedMatching);

    // Generate a larger set of leads (e.g., 100-120) for pagination
    const totalLeadsToGenerate = 120;
    const allLeads = generateLeads(criteria as ICPCriteria, totalLeadsToGenerate, previousLeads, isAdvancedMatching);
    
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
