import { NextResponse } from "next/server";
import { craftMessageWithGemini } from "@/lib/gemini-messages";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { lead, channel } = await req.json();
    
    // Validate input
    if (!lead || !channel) {
      return NextResponse.json(
        { error: "Invalid input", message: "Lead and channel are required" },
        { status: 400 }
      );
    }
    
    if (channel !== "email" && channel !== "whatsapp") {
      return NextResponse.json(
        { error: "Invalid channel", message: "Channel must be 'email' or 'whatsapp'" },
        { status: 400 }
      );
    }
    
    const message = await craftMessageWithGemini(lead, channel);
    
    if (!message) {
      return NextResponse.json(
        { error: "Could not craft message" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error("[CRAFT_MESSAGE] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}