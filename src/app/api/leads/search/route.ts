import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("[LEADS_SEARCH] Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "USA";
    const category = searchParams.get("category") || "Tech";
    const page = parseInt(searchParams.get("page") || "1", 10);

    console.log(`[LEADS_SEARCH] Fetching: country=${country}, category=${category}, page=${page}`);

    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("Country", country)
      .eq("Category", category)
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("[LEADS_SEARCH] Supabase error:", error);
      return NextResponse.json(
        { success: false, error: `Database error: ${error.message}` },
        { status: 400 }
      );
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    console.log(`[LEADS_SEARCH] Found ${totalCount} total leads, returning ${data?.length || 0}`);

    return NextResponse.json({
      success: true,
      leads: data || [],
      totalCount,
      page,
      totalPages,
      pageSize,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[LEADS_SEARCH] Error:", message);
    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}
