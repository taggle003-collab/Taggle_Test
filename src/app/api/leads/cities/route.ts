import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";

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

    let query = supabase.from("leads").select("city");

    if (country) {
      query = query.eq("country", country);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching cities:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const cities = Array.from(
      new Set((data || []).map((row) => row.city).filter(Boolean))
    ).sort();

    return NextResponse.json({ success: true, cities });
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error in GET /api/leads/cities:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
