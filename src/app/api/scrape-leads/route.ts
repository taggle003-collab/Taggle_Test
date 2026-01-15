import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { leadScraper } from "../../../lib/scrapers/orchestrator";

export async function POST(req: Request) {
  try {
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read body ONCE
    const body = await req.json();
    const criteria = body.criteria || body;

    // Set 5 second timeout for entire request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const scrapingResult = await leadScraper.scrapeLeads(criteria, 50);
      clearTimeout(timeout);

      return NextResponse.json({
        leads: scrapingResult.leads,
        isMockData: scrapingResult.leads[0]?.isMockData || false,
        source: scrapingResult.sources[0] || 'unknown',
        // Maintain compatibility with frontend
        pagination: {
          page: 1,
          limit: 50,
          total: scrapingResult.leads.length,
          pages: 1,
          hasNext: false,
          hasPrev: false
        },
        searchesRemaining: 3
      });
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API_SCRAPE_LEADS] Error:', message);

    return NextResponse.json({
      leads: [],
      error: message,
      isMockData: false
    }, { status: 500 });
  }
}
