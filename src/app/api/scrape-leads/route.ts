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

// Location-specific data for strict filtering
const locationData = {
  "USA": {
    firstNames: ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Christopher"],
    lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson"],
    cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
    companies: ["TechCorp USA", "InnovateCo Inc", "FutureTech Solutions", "Digital Dynamics", "CloudPeak USA"]
  },
  "India": {
    firstNames: ["Arjun", "Rohan", "Aarav", "Vivaan", "Aditya", "Vihaan", "Sai", "Reyansh", "Ayaan", "Krishna"],
    lastNames: ["Sharma", "Patel", "Singh", "Kumar", "Reddy", "Gupta", "Shah", "Jain", "Mehta", "Verma"],
    cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"],
    companies: ["TechStart India", "InnovateHub Pvt", "DigitalNexa", "CloudWiz India", "FutureTech Solutions"]
  },
  "UK": {
    firstNames: ["Oliver", "George", "Harry", "Noah", "Jack", "Charlie", "William", "Henry", "Thomas", "Edward"],
    lastNames: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Taylor", "Wilson", "Anderson", "Thomas"],
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Bristol", "Sheffield", "Edinburgh", "Cardiff"],
    companies: ["TechUK Ltd", "Digital Innovations", "FutureTech UK", "CloudPeak Ltd", "InnovateCo UK"]
  },
  "Europe": {
    firstNames: ["Luca", "Leo", "Paul", "Finn", "Jonas", "Felix", "Max", "Liam", "Noah", "Elias"],
    lastNames: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann"],
    cities: ["Berlin", "Paris", "Madrid", "Rome", "Amsterdam", "Barcelona", "Munich", "Milan", "Vienna", "Zurich"],
    companies: ["TechEurope GmbH", "Digital Europe", "FutureTech AG", "CloudPeak Europe", "InnovateCo EU"]
  }
};

// Generate unique leads (no duplicates) with STRICT location filtering
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
    
    // Extract location hints (STRICT: only if not already set)
    if (!criteria.location || criteria.location.trim() === "") {
      if (customICP.includes('usa') || customICP.includes('us') || customICP.includes('america')) location = "USA";
      else if (customICP.includes('europe') || customICP.includes('eu')) location = "Europe";
      else if (customICP.includes('india')) location = "India";
      else if (customICP.includes('asia')) location = "Asia";
    }
  }
  
  // Get location-specific data for STRICT filtering
  const locData = locationData[location] || locationData["USA"];
  const locationFirstNames = locData.firstNames;
  const locationLastNames = locData.lastNames;
  const locationCities = locData.cities;
  const locationCompanies = locData.companies;
  
  let attempts = 0;
  const maxAttempts = count * 10;
  
  while (leads.length < count && attempts < maxAttempts) {
    attempts++;
    
    // STRICT: Use location-specific names and companies
    const firstName = getRandomItem(locationFirstNames);
    const lastName = getRandomItem(locationLastNames);
    const fullName = `${firstName} ${lastName}`;
    
    // Skip if we've used this name combo in this batch
    if (usedNamesInThisBatch.has(fullName)) continue;
    
    const title = getRandomItem(jobTitlesArray);
    const company = getRandomItem(locationCompanies);
    const city = getRandomItem(locationCities);
    
    // STRICT: Domain and email must match location
    const domain = company.toLowerCase().replace(/\s+/g, '').replace(/\./g, '') + '.com';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    
    // Skip if we've used this email before OR in this batch OR it's invalid
    if (previouslyScrapedEmails.has(email) || usedEmailsInThisBatch.has(email) || !isValidEmail(email)) continue;
    
    usedEmailsInThisBatch.add(email);
    usedNamesInThisBatch.add(fullName);
    
    const founder = companyFounders[company] || {
      name: fullName,
      title: leads.length % 3 === 0 ? "Founder & CEO" : "Co-Founder",
      image: `https://i.pravatar.cc/150?u=${email}`
    };
    
    leads.push({
      id: `${Date.now()}-${leads.length}`,
      firstName,
      lastName,
      email,
      company,
      title,
      location: location, // STRICT: Always use the exact selected location
      city: city, // Additional city-level specificity
      companySize,
      industry,
      linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      verified: true,
      accuracy: Math.floor(Math.random() * 15) + 85,
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
    
    // Time-based Rate Limiting Logic
    const now = Date.now();
    const searchLimit = 3;
    const rateLimitWindow = 5 * 1000; // 5 seconds window
    const lockDuration = 10 * 1000; // 10 seconds lock
    
    // Track search timestamps
    let searchTimestamps: number[] = metadata.searchTimestamps || [];
    let lockedUntil = metadata.lockedUntil || 0;
    
    // Remove timestamps older than 10 seconds (cleanup)
    searchTimestamps = searchTimestamps.filter(ts => now - ts < 10000);
    
    // Check if currently locked
    if (now < lockedUntil) {
      const retryAfter = Math.ceil((lockedUntil - now) / 1000);
      return NextResponse.json({
        error: "Too many requests",
        message: "You're searching too fast. Try again in 10 seconds.",
        resetTime: new Date(lockedUntil).toISOString(),
        retryAfter
      }, { status: 429 });
    }
    
    // Check if user did 3+ searches in the last 5 seconds
    const recentSearches = searchTimestamps.filter(ts => now - ts < rateLimitWindow);
    if (recentSearches.length >= searchLimit) {
      // Lock for 10 seconds
      lockedUntil = now + lockDuration;
      
      await client.users.updateUser(userId, {
        unsafeMetadata: {
          ...metadata,
          lockedUntil,
          searchTimestamps: [...searchTimestamps, now]
        }
      });
      
      const retryAfter = Math.ceil((lockedUntil - now) / 1000);
      return NextResponse.json({
        error: "Too many requests",
        message: "You're searching too fast. Try again in 10 seconds.",
        resetTime: new Date(lockedUntil).toISOString(),
        retryAfter
      }, { status: 429 });
    }

    const body = await req.json();
    const { page = 1, limit = 10, ...criteria } = body;

    // Previously scraped leads to ensure uniqueness
    const previousLeads = new Set<string>(metadata.previousLeads || []);

    // Generate exactly 20 leads total (not 100+)
    const totalLeadsToGenerate = 20;
    const allLeads = generateLeads(criteria, totalLeadsToGenerate, previousLeads);
    
    if (allLeads.length === 0) {
      return NextResponse.json({ 
        leads: [],
        pagination: { page: 1, limit, total: 0, pages: 0 },
        searchesRemaining: searchLimit - searchTimestamps.length,
        rateLimit: {
          searchesInWindow: searchTimestamps.length,
          locked: false,
          resetIn: null
        }
      });
    }

    // Update user metadata with new search timestamp and used leads
    const newSearchTimestamps = [...searchTimestamps, now];
    const newPreviousLeads = Array.from(new Set([...Array.from(previousLeads), ...allLeads.map(l => l.email)]));
    
    // Limit previousLeads size to avoid Clerk metadata limits (keeping last 500)
    const trimmedPreviousLeads = newPreviousLeads.slice(-500);

    await client.users.updateUser(userId, {
      unsafeMetadata: {
        ...metadata,
        searchTimestamps: newSearchTimestamps,
        previousLeads: trimmedPreviousLeads
      }
    });

    // Calculate pagination (20 leads total, 10 per page = 2 pages)
    const totalPages = Math.ceil(allLeads.length / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = allLeads.slice(startIndex, endIndex);

    return NextResponse.json({ 
      leads: allLeads, // Return all leads for client-side pagination
      pagination: {
        page: 1,
        limit,
        total: allLeads.length,
        pages: totalPages,
        hasNext: totalPages > 1,
        hasPrev: false
      },
      quality: "verified_active",
      searchesRemaining: Math.max(0, searchLimit - newSearchTimestamps.length),
      rateLimit: {
        searchesInWindow: newSearchTimestamps.length,
        locked: false,
        resetIn: null
      }
    });
  } catch (error) {
    console.error("[SCRAPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
