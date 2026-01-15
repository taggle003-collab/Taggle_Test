import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ScraperOrchestrator } from "@/lib/scrapers/orchestrator";
import { saveLeads, saveSearchHistory } from "@/lib/db/leads";
import { type ICPCriteria } from "@/lib/scrapers/base-scraper";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { page = 1, limit = 20, ...criteria } = body;

    const orchestrator = new ScraperOrchestrator();
    const result = await orchestrator.scrapeLeads(criteria as ICPCriteria);

    // Save to DB in the background
    try {
      await saveLeads(userId, result.leads);
      await saveSearchHistory(userId, criteria as ICPCriteria, result.leads.length);
    } catch (dbError) {
      console.error("[API] Failed to save to DB:", dbError);
      // Don't fail the request if DB save fails, but log it
    }

    return NextResponse.json({
      leads: result.leads,
      real: result.isReal,
      mockData: !result.isReal,
      pagination: {
        page,
        limit,
        total: result.leads.length,
        pages: Math.ceil(result.leads.length / limit)
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[API] Scrape leads error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}
