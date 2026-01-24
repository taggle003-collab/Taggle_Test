import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { mapLeadRow, withBusinessTypeColumnFallback } from "@/lib/leads-db";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const businessType = searchParams.get("businessType");

    const { data, error } = await withBusinessTypeColumnFallback((businessTypeColumn) => {
      let query = supabase.from("leads").select("*", { count: "exact" });

      if (country) query = query.eq("country", country);
      if (city) query = query.eq("city", city);
      if (businessType) query = query.ilike(businessTypeColumn, `%${businessType}%`);

      return query;
    });

    if (error) {
      console.error("Error fetching leads:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const typedData = (data || []).map(mapLeadRow);

    return NextResponse.json({
      success: true,
      data: typedData,
      count: typedData.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error in GET /api/leads:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
