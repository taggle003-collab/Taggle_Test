import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";

export async function GET() {
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

    const { data, error } = await supabase.from("leads").select("country");

    if (error) {
      console.error("Error fetching countries:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const countries = Array.from(
      new Set((data || []).map((row) => row.country).filter(Boolean))
    ).sort();

    return NextResponse.json({ success: true, countries });
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error in GET /api/leads/countries:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
