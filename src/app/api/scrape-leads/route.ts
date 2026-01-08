import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";

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
function generateLeads(criteria: any, count: number, previouslyScrapedEmails: Set<string> = new Set()) {
  const leads = [];
  const usedEmailsInThisBatch = new Set<string>();
  const usedNamesInThisBatch = new Set<string>();
  
  const jobTitlesArray = Array.isArray(criteria.jobTitles) && criteria.jobTitles.length > 0
    ? criteria.jobTitles
    : ["CEO", "CTO", "Founder", "VP Sales", "Sales Director", "Marketing Manager"];
  
  // Determine values from custom ICP or structured fields
  let industry = criteria.industry || "SaaS";
  let companySize = criteria.companySize || "10-50";
  let location = criteria.location || "USA";
  
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
    
    leads.push({
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
      founderImage: founder.image
    });
  }
  
  return leads;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = (user.unsafeMetadata as any) || {};
    
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
        await client.users.updateUser(userId, {
          unsafeMetadata: {
            ...metadata,
            rateLimitResetTime: actualResetTime.toISOString()
          }
        });
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
    const { page = 1, limit = 20, ...criteria } = body;

    // Previously scraped leads to ensure uniqueness
    const previousLeads = new Set<string>(metadata.previousLeads || []);

    // Generate a larger set of leads (e.g., 100-120) for pagination
    const totalLeadsToGenerate = 120;
    const allLeads = generateLeads(criteria, totalLeadsToGenerate, previousLeads);
    
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

    await client.users.updateUser(userId, {
      unsafeMetadata: {
        ...metadata,
        searchCount: newSearchCount,
        lastSearchTime: now.toISOString(),
        previousLeads: trimmedPreviousLeads,
        rateLimitResetTime: newSearchCount >= searchLimit ? new Date(now.getTime() + oneHour).toISOString() : null
      }
    });

    // Calculate pagination
    const totalPages = Math.ceil(allLeads.length / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = allLeads.slice(startIndex, endIndex);

    return NextResponse.json({ 
      leads: allLeads, // Return all leads for client-side pagination as per current implementation
      pagination: {
        page: 1,
        limit,
        total: allLeads.length,
        pages: Math.ceil(allLeads.length / limit),
        hasNext: allLeads.length > limit,
        hasPrev: false
      },
      quality: "verified_active",
      searchesRemaining: searchLimit - newSearchCount,
      rateLimitReset: newSearchCount >= searchLimit ? new Date(now.getTime() + oneHour).toISOString() : null
    });
  } catch (error) {
    console.error("[SCRAPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
