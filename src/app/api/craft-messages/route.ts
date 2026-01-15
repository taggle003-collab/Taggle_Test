import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  matchQualityScore?: number;
}

interface CraftRequest {
  lead: Lead;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lead }: CraftRequest = await req.json();

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

    const prompt = buildPrompt(lead);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [{
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

function buildPrompt(lead: Lead): string {
  return `You are an expert B2B sales copywriter. Craft 3 personalized outreach messages for this lead:

Lead Details:
- Name: ${lead.firstName} ${lead.lastName}
- Title: ${lead.title}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Location: ${lead.location}
- Company Size: ${lead.companySize}
- Email: ${lead.email}

Create EXACTLY 3 messages in this format (each separated by "---"):

WHATSAPP_MESSAGE:
[Casual, friendly WhatsApp message (2-3 sentences). Use emojis sparingly. Include a call-to-action.]

---

EMAIL_MESSAGE:
[Professional email message (subject + body). Include: compelling subject line, personalized greeting, value proposition, and call-to-action.]

---

LINKEDIN_MESSAGE:
[LinkedIn/Social media message (1-2 sentences). Professional but conversational. Include a hook that relates to their industry.]

Make each message personalized to the lead's role, company, and industry. Be concise, value-focused, and include clear CTAs.`;
}

function parseMessages(content: string): {
  whatsapp: string;
  email: string;
  social: string;
} {
  try {
    const sections = content.split("---");

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
