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

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLeads(criteria: any, count: number) {
  const leads = [];
  const jobTitlesArray = Array.isArray(criteria.jobTitles) ? criteria.jobTitles : [];
  
  for (let i = 0; i < count; i++) {
    const firstName = getRandomItem(firstNames);
    const lastName = getRandomItem(lastNames);
    const title = jobTitlesArray.length > 0 
      ? getRandomItem(jobTitlesArray)
      : getRandomItem(["CEO", "CTO", "Founder", "VP Sales", "Sales Director", "Marketing Manager"]);
    
    const company = getRandomItem(companies);
    const domain = company.toLowerCase().replace(/\s+/g, '') + '.com';
    
    leads.push({
      id: `${Date.now()}-${i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      company,
      title,
      location: criteria.location || "USA",
      companySize: criteria.companySize || "10-50",
      industry: criteria.industry || "SaaS",
      linkedInProfile: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
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
    const criteria = await req.json();

    // Generate random number of leads between 10 and 50
    const leadCount = Math.floor(Math.random() * 41) + 10;
    const mockLeads = generateLeads(criteria, leadCount);

    return NextResponse.json({ 
      leads: mockLeads,
      count: mockLeads.length 
    });
  } catch (error) {
    console.error("[SCRAPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
