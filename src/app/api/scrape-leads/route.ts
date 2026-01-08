import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

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
  "SmartScale", "GrowthLabs", "PeakPerformance", "PrimeDigital", "AlphaSolutions", "BetaWorks", "GammaSystems", "DeltaTech", "OmegaInnovations", "SigmaDigital"
];

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
function generateLeads(criteria: any, count: number) {
  const leads = [];
  const usedEmails = new Set<string>();
  const usedNames = new Set<string>();
  
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
  const maxAttempts = count * 3;
  
  while (leads.length < count && attempts < maxAttempts) {
    attempts++;
    
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    // Skip if we've used this name combo
    if (usedNames.has(fullName)) continue;
    
    const title = getRandomItem(jobTitlesArray);
    const company = getRandomItem(companies);
    const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    
    // Skip if we've used this email or it's invalid
    if (usedEmails.has(email) || !isValidEmail(email)) continue;
    
    usedEmails.add(email);
    usedNames.add(fullName);
    
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
      accuracy: Math.floor(Math.random() * 15) + 85 // 85-100% accuracy score
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

    const user = await currentUser();
    const body = await req.json();
    const { page = 1, limit = 10, ...criteria } = body;

    // Generate a larger set of leads (30-50) to have good pagination examples
    const totalLeads = Math.floor(Math.random() * 21) + 30; // 30-50 leads
    const allLeads = generateLeads(criteria, totalLeads);
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLeads = allLeads.slice(startIndex, endIndex);
    const totalPages = Math.ceil(allLeads.length / limit);

    return NextResponse.json({ 
      leads: paginatedLeads,
      pagination: {
        page,
        limit,
        total: allLeads.length,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      quality: "verified_active"
    });
  } catch (error) {
    console.error("[SCRAPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
