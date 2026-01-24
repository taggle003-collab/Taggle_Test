import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import {
  mapLeadRow,
  withBusinessTypeColumnFallback,
  type LeadFilters,
} from "@/lib/leads-db";

export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: "Supabase not configured" },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as LeadFilters;
    const { country, city, businessType } = body;

    const { data, error } = await withBusinessTypeColumnFallback((businessTypeColumn) => {
      let query = supabase.from("leads").select("*");

      if (country) query = query.eq("country", country);
      if (city) query = query.eq("city", city);
      if (businessType) query = query.ilike(businessTypeColumn, `%${businessType}%`);

      return query;
    });

    if (error) {
      console.error("Error searching leads:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const typedData = (data || []).map(mapLeadRow);

    return NextResponse.json({
      success: true,
      data: typedData,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error in POST /api/leads/search:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
