import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import type { Lead } from "@/lib/lead-types";

interface CraftRequest {
  lead: Lead;
  tone?: string;
  style?: string;
  sampleLines?: string;
  talkingPoints?: string;
  platformType?: "whatsapp" | "email" | "social";
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lead, tone, style, sampleLines, talkingPoints, platformType }: CraftRequest = await req.json();

    if (!lead || !lead.email || !lead.company) {
      return NextResponse.json(
        { error: "Invalid lead data" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) {
      console.error("[CRAFT_MESSAGES] LLM_API_KEY not configured");
      return NextResponse.json(
        { error: "API not configured" },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(lead, tone, style, sampleLines, talkingPoints, platformType);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{
          role: "system",
          content: "You are an expert B2B sales copywriter. Your goal is to MATCH the user's provided sample lines EXACTLY in terms of style, length, and vocabulary. Always provide clean, plain text without any markdown formatting, bolding (**), or em dashes (—). Use only standard punctuation."
        }, {
          role: "user",
          content: prompt,
        }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[CRAFT_MESSAGES] OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to craft messages" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (platformType) {
      // Individual regeneration
      const cleanMessage = content
        .replace(/\*\*/g, "")
        .replace(/—/g, "-")
        .trim();
      return NextResponse.json({ message: cleanMessage });
    }

    const messages = parseMessages(content);

    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRAFT_MESSAGES] Error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

function buildPrompt(
  lead: Lead, 
  tone?: string, 
  style?: string, 
  sampleLines?: string, 
  talkingPoints?: string,
  platformType?: string
): string {
  const contextInfo = `
Lead Details:
- Name: ${lead.firstName} ${lead.lastName}
- Title: ${lead.title}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Location: ${lead.location}
- Company Size: ${lead.companySize}
- Email: ${lead.email}

Desired Tone: ${tone || "Professional"}
Desired Style: ${style || "Direct and value-focused"}
User's Sample Style: ${sampleLines || "N/A"}
Additional Talking Points: ${talkingPoints || "N/A"}

CRITICAL STYLE INSTRUCTIONS:
1. MATCH the "User's Sample Style" provided above EXACTLY. If they are brief, you be brief. If they are casual, you be casual.
2. ADHERE to the "Desired Tone" and "Desired Style" descriptions.
3. NO markdown formatting of any kind.
4. NO bold text (absolutely no **).
5. NO em dashes (use commas, periods, or hyphens).
6. Provide CLEAN, plain text only.
`;

  if (platformType) {
    return `${contextInfo}
    
Craft ONE personalized outreach message for the ${platformType.toUpperCase()} platform.
Make it personalized to the lead's role, company, and industry. Be concise and value-focused.
Provide ONLY the message content, no labels or extra text.`;
  }

  return `${contextInfo}

Craft 3 personalized outreach messages for this lead.

Create EXACTLY 3 messages in this format (each separated by "---"):

WHATSAPP_MESSAGE:
[WhatsApp message based on the tone/style provided. 2-3 sentences. No bold, no markdown.]

---

EMAIL_MESSAGE:
[Email message (subject + body) based on the tone/style provided. No bold, no markdown.]

---

LINKEDIN_MESSAGE:
[LinkedIn/Social media message based on the tone/style provided. 1-2 sentences. No bold, no markdown.]

Make each message personalized to the lead's role, company, and industry. Be concise, value-focused, and include clear CTAs.`;
}

function parseMessages(content: string): {
  whatsapp: string;
  email: string;
  social: string;
} {
  try {
    // Remove any markdown bolding and em dashes
    const cleanContent = content.replace(/\*\*/g, "").replace(/—/g, "-");
    const sections = cleanContent.split("---");

    let whatsapp = "";
    let email = "";
    let social = "";

    sections.forEach(section => {
      if (section.includes("WHATSAPP")) {
        whatsapp = section
          .replace(/WHATSAPP_MESSAGE:/gi, "")
          .trim();
      }
      if (section.includes("EMAIL")) {
        email = section
          .replace(/EMAIL_MESSAGE:/gi, "")
          .trim();
      }
      if (section.includes("LINKEDIN") || section.includes("SOCIAL")) {
        social = section
          .replace(/LINKEDIN_MESSAGE:/gi, "")
          .replace(/SOCIAL_MEDIA_MESSAGE:/gi, "")
          .trim();
      }
    });

    return {
      whatsapp: whatsapp || "WhatsApp message could not be generated",
      email: email || "Email message could not be generated",
      social: social || "Social media message could not be generated",
    };
  } catch (error) {
    console.error("[CRAFT_MESSAGES] Parse error:", error);
    return {
      whatsapp: "Hi, interested in learning more about your product.",
      email: "Subject: Quick question about your services\n\nHi, I noticed your company and thought we could explore opportunities together.",
      social: "Would love to connect and discuss how we can help your team.",
    };
  }
}
