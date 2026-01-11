/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

// Type definitions
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

// Realistic data mappings for proper criteria matching
const industryData = {
  "SaaS": {
    keywords: ["saas", "software", "cloud", "platform", "tech", "startup"],
    companies: ["TechCorp", "CloudFlow", "DataSync", "NextGen SaaS", "InnovateSoft", "ScaleUp", "CloudNine", "ModernStack", "Quantum SaaS", "Alpha Cloud"],
    jobTitles: ["CEO", "CTO", "Founder", "VP Sales", "Sales Director", "Marketing Manager", "Product Manager", "Engineering Manager", "VP Marketing", "Growth Lead"],
    companySizes: ["10-50", "50-100", "100-500"],
    locations: ["USA", "Europe", "Canada"]
  },
  "Healthcare": {
    keywords: ["health", "medical", "healthcare", "pharma", "biotech", "medtech"],
    companies: ["HealthCorp", "MedTech Solutions", "BioInnovate", "HealthFlow", "MediSoft", "BioTech Labs", "HealthSync", "MedInnovate", "BioCore", "HealthScale"],
    jobTitles: ["CEO", "CTO", "Founder", "Medical Director", "VP Operations", "R&D Manager", "Clinical Director", "Regulatory Affairs", "VP Marketing", "Business Development"],
    companySizes: ["50-100", "100-500", "500-1000"],
    locations: ["USA", "Europe", "Asia"]
  },
  "Finance": {
    keywords: ["finance", "fintech", "banking", "investment", "trading", "insurance"],
    companies: ["FinanceCore", "PayFlow", "FinTech Innovations", "CapitalFlow", "InvestTech", "PaySecure", "FinanceCloud", "CapitalTech", "PayTech", "FinanceNext"],
    jobTitles: ["CEO", "CTO", "Founder", "CFO", "VP Finance", "Risk Manager", "Compliance Officer", "VP Operations", "Product Manager", "VP Sales"],
    companySizes: ["100-500", "500-1000", "1000+"],
    locations: ["USA", "UK", "Europe", "Singapore"]
  },
  "Retail": {
    keywords: ["retail", "ecommerce", "e-commerce", "shopping", "consumer", "commerce"],
    companies: ["RetailFlow", "CommerceTech", "Shopify Plus", "RetailScale", "ConsumerTech", "MarketFlow", "RetailCloud", "ShopTech", "ConsumerFlow", "RetailNext"],
    jobTitles: ["CEO", "CTO", "Founder", "VP E-commerce", "Marketing Director", "Operations Manager", "Merchandising Manager", "Digital Marketing", "VP Sales", "Customer Experience"],
    companySizes: ["50-100", "100-500", "500-1000"],
    locations: ["USA", "Europe", "Asia", "Australia"]
  },
  "Education": {
    keywords: ["education", "edtech", "learning", "school", "university", "training"],
    companies: ["EduTech", "LearnFlow", "EduInnovate", "StudyTech", "LearnNext", "EduCloud", "SkillTech", "LearnScale", "EduNext", "SkillFlow"],
    jobTitles: ["CEO", "CTO", "Founder", "Dean", "Academic Director", "VP Education", "Learning Manager", "Curriculum Director", "EdTech Manager", "VP Operations"],
    companySizes: ["10-50", "50-100", "100-500"],
    locations: ["USA", "UK", "Europe", "Canada", "Australia"]
  },
  "Manufacturing": {
    keywords: ["manufacturing", "industrial", "production", "factory", "supply", "logistics"],
    companies: ["ManufactureTech", "IndustrialFlow", "ProductionCore", "ManufactureNext", "IndustrialScale", "ProductionTech", "ManufactureCloud", "IndustrialCore", "ProductionNext", "ManufactureFlow"],
    jobTitles: ["CEO", "CTO", "Founder", "VP Operations", "Plant Manager", "Supply Chain Director", "Manufacturing Manager", "Quality Director", "Engineering Manager", "VP Sales"],
    companySizes: ["100-500", "500-1000", "1000+"],
    locations: ["USA", "Europe", "Asia", "Germany"]
  }
};

const locations = {
  "USA": {
    keywords: ["usa", "us", "america", "united states", "american", "silicon valley", "new york", "san francisco", "chicago", "seattle"],
    companies: ["TechCorp", "InnovateCo", "FutureTech", "DataMax", "CloudNine", "NextGen", "GrowthLabs", "PrimeDigital", "AlphaSolutions", "PeakPerformance"],
    cities: ["San Francisco", "New York", "Seattle", "Austin", "Chicago", "Boston", "Los Angeles", "Denver", "Atlanta", "Miami"]
  },
  "Europe": {
    keywords: ["europe", "eu", "european", "uk", "germany", "france", "netherlands", "sweden"],
    companies: ["EuroTech", "EuroInnovate", "EuroCore", "EuroNext", "EuroCloud", "EuroScale", "EuroFlow", "EuroData", "EuroSoft", "EuroSolutions"],
    cities: ["London", "Berlin", "Paris", "Amsterdam", "Stockholm", "Dublin", "Zurich", "Vienna", "Brussels", "Helsinki"]
  },
  "UK": {
    keywords: ["uk", "britain", "british", "england", "london"],
    companies: ["UK Tech", "British Innovations", "London Tech", "UK Solutions", "British Core", "London Data", "UK Cloud", "British Flow", "London Scale", "UK Next"],
    cities: ["London", "Manchester", "Birmingham", "Leeds", "Edinburgh", "Glasgow", "Bristol", "Liverpool", "Sheffield", "Cardiff"]
  },
  "India": {
    keywords: ["india", "indian", "bangalore", "mumbai", "delhi", "hyderabad", "pune", "chennai"],
    companies: ["IndiTech", "India Innovations", "Bangalore Tech", "Mumbai Solutions", "Delhi Cloud", "Hyderabad Data", "Pune Software", "Chennai Tech", "India Next", "Indian Core"],
    cities: ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Surat"]
  },
  "Canada": {
    keywords: ["canada", "canadian", "toronto", "vancouver", "montreal", "calgary"],
    companies: ["CanTech", "Canadian Innovations", "Toronto Tech", "Vancouver Solutions", "Montreal Core", "Calgary Cloud", "Canada Next", "Canadian Flow", "Toronto Data", "Canada Scale"],
    cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Winnipeg", "Quebec City", "Hamilton", "Kitchener"]
  },
  "Asia": {
    keywords: ["asia", "asian", "singapore", "tokyo", "seoul", "hong kong", "shanghai", "beijing"],
    companies: ["AsiaTech", "Asian Innovations", "Singapore Tech", "Tokyo Solutions", "Seoul Core", "Hong Kong Cloud", "Asia Next", "Asian Flow", "Tokyo Data", "Singapore Scale"],
    cities: ["Singapore", "Tokyo", "Seoul", "Hong Kong", "Shanghai", "Beijing", "Taipei", "Bangkok", "Kuala Lumpur", "Jakarta"]
  },
  "Australia": {
    keywords: ["australia", "australian", "sydney", "melbourne", "perth", "brisbane", "adelaide"],
    companies: ["AusTech", "Australian Innovations", "Sydney Tech", "Melbourne Solutions", "Perth Core", "Brisbane Cloud", "Australia Next", "Australian Flow", "Sydney Data", "Australia Scale"],
    cities: ["Sydney", "Melbourne", "Perth", "Brisbane", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Wollongong", "Hobart"]
  },
  "Singapore": {
    keywords: ["singapore", "sg", "asia pacific", "apac"],
    companies: ["SG Tech", "Singapore Innovations", "Asia Pacific Solutions", "SG Core", "Singapore Cloud", "Asia Tech", "SG Next", "Singapore Flow", "Asia Solutions", "SG Data"],
    cities: ["Singapore"]
  }
};

// Note: companySizes mapping kept for future use
// const companySizes = {
//   "1-10": ["Early-stage", "Startup", "Bootstrap"],
//   "10-50": ["Growth-stage", "Scale-up", "Mid-size"],
//   "50-100": ["Expanding", "Mid-size", "Growth"],
//   "100-500": ["Established", "Mid-to-large", "Corporate"],
//   "500-1000": ["Large", "Enterprise", "Corporate"],
//   "1000+": ["Enterprise", "Large corporation", "Multinational"]
// };

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

// Enhanced custom ICP parsing with better pattern matching
function parseCustomICP(icpText: string): Partial<ICPCriteria> {
  const result: Partial<ICPCriteria> = {};
  const text = icpText.toLowerCase();
  
  // Industry mapping with multiple keywords
  const industryPatterns = {
    'saas': ['saas', 'software', 'cloud', 'platform', 'b2b', 'startup', 'tech'],
    'healthcare': ['health', 'medical', 'healthcare', 'pharma', 'biotech', 'medtech', 'clinical'],
    'finance': ['finance', 'fintech', 'banking', 'investment', 'trading', 'insurance', 'wealth'],
    'retail': ['retail', 'ecommerce', 'e-commerce', 'shopping', 'consumer', 'commerce', 'marketplace'],
    'education': ['education', 'edtech', 'learning', 'school', 'university', 'training', 'course'],
    'manufacturing': ['manufacturing', 'industrial', 'production', 'factory', 'supply', 'logistics']
  };
  
  // Location patterns
  const locationPatterns = {
    'usa': ['usa', 'us', 'america', 'united states', 'american', 'silicon valley', 'new york', 'san francisco', 'chicago', 'seattle', 'boston', 'austin', 'los angeles', 'denver', 'atlanta', 'miami'],
    'europe': ['europe', 'eu', 'european', 'uk', 'germany', 'france', 'netherlands', 'sweden', 'london', 'berlin', 'paris', 'amsterdam', 'stockholm'],
    'uk': ['uk', 'britain', 'british', 'england', 'london', 'manchester', 'birmingham'],
    'india': ['india', 'indian', 'bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai'],
    'canada': ['canada', 'canadian', 'toronto', 'vancouver', 'montreal', 'calgary'],
    'asia': ['asia', 'asian', 'singapore', 'tokyo', 'seoul', 'hong kong', 'shanghai', 'beijing', 'taipei'],
    'australia': ['australia', 'australian', 'sydney', 'melbourne', 'perth', 'brisbane', 'adelaide'],
    'singapore': ['singapore', 'sg', 'asia pacific', 'apac']
  };
  
  // Company size patterns
  const sizePatterns = {
    '1-10': ['early-stage', 'startup', 'bootstrap', 'pre-seed', 'seed', 'founder', '1-10', 'small team'],
    '10-50': ['growth-stage', 'scale-up', 'mid-size', '10-50', 'startup', 'growing'],
    '50-100': ['mid-size', 'expanding', '50-100', 'established'],
    '100-500': ['established', 'mid-to-large', 'corporate', '100-500', 'growth'],
    '500-1000': ['large', 'enterprise', 'corporate', '500-1000', 'established'],
    '1000+': ['enterprise', 'large corporation', 'multinational', '1000+', 'mega']
  };
  
  // Job title patterns
  const titlePatterns = {
    'ceo': ['ceo', 'chief executive', 'founder', 'president'],
    'cto': ['cto', 'chief technology', 'tech lead', 'engineering lead'],
    'cfo': ['cfo', 'chief financial', 'finance lead'],
    'founder': ['founder', 'co-founder', 'cofounder'],
    'vp': ['vp', 'vice president', 'svp', 'evp'],
    'director': ['director', 'head of'],
    'manager': ['manager', 'lead', 'head'],
    'sales': ['sales', 'revenue', 'business development'],
    'marketing': ['marketing', 'growth', 'brand'],
    'product': ['product', 'pm', 'product manager'],
    'engineering': ['engineering', 'development', 'tech', 'software'],
    'operations': ['operations', 'ops', 'operational']
  };
  
  // Parse industry
  for (const [industry, patterns] of Object.entries(industryPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      result.industry = industry.charAt(0).toUpperCase() + industry.slice(1);
      break;
    }
  }
  
  // Parse location
  for (const [location, patterns] of Object.entries(locationPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      result.location = location.toUpperCase();
      break;
    }
  }
  
  // Parse company size
  for (const [size, patterns] of Object.entries(sizePatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      result.companySize = size;
      break;
    }
  }
  
  // Parse job titles
  const jobTitles: string[] = [];
  for (const [category, patterns] of Object.entries(titlePatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      if (category === 'ceo') jobTitles.push('CEO');
      else if (category === 'cto') jobTitles.push('CTO');
      else if (category === 'cfo') jobTitles.push('CFO');
      else if (category === 'founder') jobTitles.push('Founder');
      else if (category === 'vp') jobTitles.push('VP Sales');
      else if (category === 'director') jobTitles.push('Director');
      else if (category === 'manager') jobTitles.push('Manager');
      else if (category === 'sales') jobTitles.push('Sales Manager');
      else if (category === 'marketing') jobTitles.push('Marketing Manager');
      else if (category === 'product') jobTitles.push('Product Manager');
      else if (category === 'engineering') jobTitles.push('Engineering Manager');
      else if (category === 'operations') jobTitles.push('Operations Manager');
    }
  }
  
  if (jobTitles.length > 0) {
    result.jobTitles = jobTitles;
  }
  
  return result;
}

// Generate leads that actually match criteria (not filtered after generation)
function generateLeads(criteria: ICPCriteria, count: number, previouslyScrapedEmails: Set<string> = new Set(), isAdvancedMatching: boolean = false): Lead[] {
  const leads: Lead[] = [];
  const usedEmailsInThisBatch = new Set<string>();
  const usedNamesInThisBatch = new Set<string>();
  
  // Parse custom ICP to supplement structured criteria
  let parsedCriteria = criteria;
  if (criteria.customICP && criteria.customICP.trim()) {
    const parsed = parseCustomICP(criteria.customICP);
    parsedCriteria = { ...criteria, ...parsed };
  }
  
  // Use provided criteria or fall back to data-driven defaults
  const targetIndustry = parsedCriteria.industry || "SaaS";
  const targetLocation = parsedCriteria.location || "USA";
  const targetCompanySize = parsedCriteria.companySize || "10-50";
  const targetJobTitles = parsedCriteria.jobTitles && parsedCriteria.jobTitles.length > 0 
    ? parsedCriteria.jobTitles 
    : industryData[targetIndustry as keyof typeof industryData]?.jobTitles || ["CEO", "CTO", "Founder", "VP Sales", "Marketing Manager"];
  
  // Get realistic data for the target industry and location
  const industryInfo = industryData[targetIndustry as keyof typeof industryData] || industryData["SaaS"];
  const locationInfo = locations[targetLocation as keyof typeof locations] || locations["USA"];
  
  // Revenue and funding options for advanced matching
  const revenueOptions = ["Under $1M", "$1M - $10M", "$10M - $100M", "$100M - $1B", "$1B+"];
  const fundingOptions = ["Bootstrapped", "Pre-seed", "Seed", "Series A", "Series B", "Series C+"];
  
  let attempts = 0;
  const maxAttempts = count * 5; // Reduced attempts since we're generating matching leads
  
  while (leads.length < count && attempts < maxAttempts) {
    attempts++;
    
    // Generate realistic data that matches criteria
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    if (usedNamesInThisBatch.has(fullName)) continue;
    
    // Use industry-specific job titles with fallback
    const title = getRandomItem(targetJobTitles);
    
    // Use industry-specific companies with location-based fallback
    const industryCompanies = industryInfo.companies;
    const locationCompanies = locationInfo.companies;
    const companyPool = industryCompanies.length > 0 ? industryCompanies : locationCompanies;
    const company = getRandomItem(companyPool);
    
    const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    
    // Skip if we've used this email before OR in this batch OR it's invalid
    if (previouslyScrapedEmails.has(email) || usedEmailsInThisBatch.has(email) || !isValidEmail(email)) continue;
    
    usedEmailsInThisBatch.add(email);
    usedNamesInThisBatch.add(fullName);
    
    const founder = companyFounders[company] || {
      name: getRandomItem(firstNames) + " " + getRandomItem(lastNames),
      title: "Founder & CEO",
      image: `https://i.pravatar.cc/150?u=${company.toLowerCase()}`
    };
    
    // Advanced matching fields
    let fundingStage: string | undefined;
    let annualRevenue: string | undefined;
    let matchQualityScore: number | undefined;
    const matchedCriteria: string[] = [];
    
    // Calculate matched criteria and quality score
    if (parsedCriteria.industry) {
      if (targetIndustry === parsedCriteria.industry) {
        matchedCriteria.push('industry');
      }
    }
    
    if (parsedCriteria.location) {
      if (targetLocation.toLowerCase() === parsedCriteria.location.toLowerCase() || 
          targetLocation.toLowerCase().includes(parsedCriteria.location.toLowerCase())) {
        matchedCriteria.push('location');
      }
    }
    
    if (parsedCriteria.companySize) {
      if (targetCompanySize === parsedCriteria.companySize) {
        matchedCriteria.push('company size');
      }
    }
    
    if (parsedCriteria.jobTitles && parsedCriteria.jobTitles.length > 0) {
      if (parsedCriteria.jobTitles.some(t => title.toLowerCase().includes(t.toLowerCase()))) {
        matchedCriteria.push('job title');
      }
    }
    
    if (isAdvancedMatching) {
      // Assign funding stage
      if (parsedCriteria.fundingStage) {
        fundingStage = parsedCriteria.fundingStage;
      } else {
        fundingStage = getRandomItem(fundingOptions);
      }
      
      // Assign annual revenue
      if (parsedCriteria.annualRevenue) {
        annualRevenue = parsedCriteria.annualRevenue;
      } else {
        annualRevenue = getRandomItem(revenueOptions);
      }
      
      // Calculate match quality score
      let score = 0;
      let maxScore = 0;
      
      if (parsedCriteria.industry) {
        maxScore += 25;
        if (targetIndustry === parsedCriteria.industry) score += 25;
      }
      
      if (parsedCriteria.companySize) {
        maxScore += 20;
        if (targetCompanySize === parsedCriteria.companySize) score += 20;
      }
      
      if (parsedCriteria.location) {
        maxScore += 20;
        if (targetLocation.toLowerCase() === parsedCriteria.location.toLowerCase() || 
            targetLocation.toLowerCase().includes(parsedCriteria.location.toLowerCase())) {
          score += 20;
        }
      }
      
      if (parsedCriteria.jobTitles && parsedCriteria.jobTitles.length > 0) {
        maxScore += 25;
        if (parsedCriteria.jobTitles.some(t => title.toLowerCase().includes(t.toLowerCase()))) {
          score += 25;
        }
      }
      
      if (parsedCriteria.annualRevenue) {
        maxScore += 5;
        if (annualRevenue === parsedCriteria.annualRevenue) score += 5;
      }
      
      if (parsedCriteria.fundingStage) {
        maxScore += 5;
        if (fundingStage === parsedCriteria.fundingStage) score += 5;
      }
      
      matchQualityScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 85;
      
      // Add revenue/funding matches to criteria
      if (parsedCriteria.annualRevenue && annualRevenue === parsedCriteria.annualRevenue) {
        matchedCriteria.push('revenue');
      }
      
      if (parsedCriteria.fundingStage && fundingStage === parsedCriteria.fundingStage) {
        matchedCriteria.push('funding');
      }
      
      // Quality score filtering for advanced matching
      if (parsedCriteria.qualityScore && matchQualityScore < parsedCriteria.qualityScore) {
        continue; // Skip this lead if it doesn't meet quality threshold
      }
    }
    
    const lead: Lead = {
      id: `${Date.now()}-${leads.length}-${Math.random().toString(36).substr(2, 9)}`,
      firstName,
      lastName,
      email,
      company,
      title,
      location: targetLocation,
      companySize: targetCompanySize,
      industry: targetIndustry,
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
      lead.matchedCriteria = matchedCriteria.length > 0 ? matchedCriteria : undefined;
    } else {
      // For Lite plan users, still provide matchedCriteria for transparency
      lead.matchedCriteria = matchedCriteria.length > 0 ? matchedCriteria : ['basic matching'];
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = authError as any;
      console.error("[SCRAPE_AUTH_ERROR]", {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      
      return NextResponse.json(
        { 
          error: "Authentication failed", 
          message: "Authentication failed. Please sign in again.",
          details: error.message,
          clerkError: true,
          code: error.code || "auth_failed",
          status: error.status || 422
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
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let client: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let metadata: any = {};
    
    try {
      client = await clerkClient();
      console.log("[SCRAPE_LEADS] Clerk client created, fetching user...");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user = await (client as any).users.getUser(userId);
      console.log("[SCRAPE_LEADS] User fetched successfully");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata = (user as any).unsafeMetadata || {};
      console.log("[SCRAPE_LEADS] User metadata:", Object.keys(metadata));
    } catch (userError: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = userError as any;
      console.error("[SCRAPE_USER_ERROR]", {
        message: error.message,
        status: error.status,
        code: error.code,
        details: error.details
      });
      
      return NextResponse.json(
        { 
          error: "Failed to fetch user data", 
          message: "Could not retrieve user information. Please try again.",
          details: error.message,
          clerkError: true,
          code: error.code || "user_fetch_failed"
        },
        { status: 422 }
      );
    }
    
    // Rate Limiting Logic
    const now = new Date();
    const searchLimit = 3;
    const oneHour = 60 * 60 * 1000;
    
    let searchCount = metadata.searchCount || 0;
    const lastSearchTime = metadata.lastSearchTime ? new Date(metadata.lastSearchTime) : null;
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (client as any).users.updateUser(userId, {
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

    // Parse custom ICP to supplement structured criteria
    let parsedCriteria = { ...criteria };
    if (criteria.customICP && criteria.customICP.trim()) {
      const parsed = parseCustomICP(criteria.customICP);
      parsedCriteria = { ...criteria, ...parsed };
    }

    // Determine if user has advanced matching (Solo or Pro plan)
    const userPlan = metadata.plan as string | undefined;
    const isAdvancedMatching = userPlan === "solo" || userPlan === "pro";

    console.log("[SCRAPE_LEADS] Parsed criteria:", parsedCriteria);
    console.log("[SCRAPE_LEADS] User plan:", userPlan);
    console.log("[SCRAPE_LEADS] Advanced matching:", isAdvancedMatching);

    // Generate a larger set of leads (e.g., 100-120) for pagination
    const totalLeadsToGenerate = 120;
    console.log("[SCRAPE_LEADS] Generating leads with criteria:", {
      industry: parsedCriteria.industry,
      location: parsedCriteria.location,
      companySize: parsedCriteria.companySize,
      jobTitles: parsedCriteria.jobTitles,
      customICP: parsedCriteria.customICP,
      annualRevenue: parsedCriteria.annualRevenue,
      fundingStage: parsedCriteria.fundingStage,
      qualityScore: parsedCriteria.qualityScore,
      isAdvancedMatching
    });
    
    const allLeads = generateLeads(criteria as ICPCriteria, totalLeadsToGenerate, previousLeads, isAdvancedMatching);
    
    console.log("[SCRAPE_LEADS] Generated leads:", {
      totalGenerated: allLeads.length,
      withAdvancedFields: allLeads.filter(l => l.fundingStage || l.annualRevenue || l.matchQualityScore).length,
      withMatchedCriteria: allLeads.filter(l => l.matchedCriteria && l.matchedCriteria.length > 0).length
    });
    
    // Log some sample criteria matches for verification
    if (allLeads.length > 0) {
      const sampleLeads = allLeads.slice(0, 3);
      console.log("[SCRAPE_LEADS] Sample lead criteria matches:", sampleLeads.map(lead => ({
        leadId: lead.id,
        industry: lead.industry,
        location: lead.location,
        companySize: lead.companySize,
        title: lead.title,
        matchedCriteria: lead.matchedCriteria,
        matchQualityScore: lead.matchQualityScore
      })));
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
      await (client as any).users.updateUser(userId, {
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
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedLeads = allLeads.slice(startIndex, endIndex);

    return NextResponse.json({ 
      leads: paginatedLeads, // Return paginated leads
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allLeads.length,
        pages: Math.ceil(allLeads.length / limitNum),
        hasNext: endIndex < allLeads.length,
        hasPrev: pageNum > 1
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
