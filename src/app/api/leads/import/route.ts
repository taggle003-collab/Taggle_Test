import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isSupabaseConfigured, type Lead } from "@/lib/supabase-client";

function isColumnNotFound(message: string | undefined): boolean {
  if (!message) return false;
  return /column .* does not exist/i.test(message);
}

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

    const body = (await req.json()) as { leads?: Lead[] };

    if (!body.leads || !Array.isArray(body.leads)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body. Expected { leads: Lead[] }" },
        { status: 400 }
      );
    }

    const camelRows = body.leads.map((lead) => ({
      userId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      website: lead.website,
      socialMedia: lead.socialMedia,
      country: lead.country,
      city: lead.city,
      businessType: lead.businessType,
    }));

    const snakeRows = body.leads.map((lead) => ({
      user_id: userId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      website: lead.website,
      social_media: lead.socialMedia,
      country: lead.country,
      city: lead.city,
      business_type: lead.businessType,
    }));

    let insertResult = await supabase.from("leads").insert(camelRows);

    if (insertResult.error && isColumnNotFound(insertResult.error.message)) {
      insertResult = await supabase.from("leads").insert(snakeRows);
    }

    if (insertResult.error && isColumnNotFound(insertResult.error.message)) {
      const snakeRowsNoUser = snakeRows.map(({ user_id, ...rest }) => rest);
      insertResult = await supabase.from("leads").insert(snakeRowsNoUser);
    }

    if (insertResult.error) {
      console.error("Error importing leads:", insertResult.error);
      return NextResponse.json(
        { success: false, error: insertResult.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, imported: body.leads.length });
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error in POST /api/leads/import:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
