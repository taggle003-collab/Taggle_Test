import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await currentUser();
    const criteria = await req.json();

    // Mock scraping logic
    // In a real app, this would call an external API or run a scraping task
    const mockLeads = [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        company: "TechCorp",
        title: "CEO",
        location: criteria.location || "USA",
        companySize: criteria.companySize || "10-50",
        industry: criteria.industry || "SaaS",
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@startup.io",
        company: "Startuply",
        title: "Founder",
        location: criteria.location || "USA",
        companySize: criteria.companySize || "10-50",
        industry: criteria.industry || "SaaS",
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike@enterprise.com",
        company: "BigSoft",
        title: "CTO",
        location: criteria.location || "USA",
        companySize: criteria.companySize || "10-50",
        industry: criteria.industry || "SaaS",
      },
      {
        id: "4",
        name: "Sarah Williams",
        email: "sarah@healthtech.com",
        company: "Healthify",
        title: "Head of Growth",
        location: criteria.location || "USA",
        companySize: criteria.companySize || "10-50",
        industry: criteria.industry || "SaaS",
      },
      {
        id: "5",
        name: "Robert Brown",
        email: "robert@fintech.co",
        company: "PayFlow",
        title: "VP Engineering",
        location: criteria.location || "USA",
        companySize: criteria.companySize || "10-50",
        industry: criteria.industry || "SaaS",
      }
    ];

    // Filter leads to match criteria even better (if we had more mock data)
    // For now we just return the mock leads using the criteria provided in the response

    return NextResponse.json({ 
      leads: mockLeads,
      count: mockLeads.length 
    });
  } catch (error) {
    console.error("[SCRAPE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
