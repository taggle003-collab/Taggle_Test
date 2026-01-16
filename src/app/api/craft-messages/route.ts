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
  tone?: string;
  sampleText?: string;
  talkingPoints?: string;
  platform?: 'whatsapp' | 'email' | 'linkedin';
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lead, tone, sampleText, talkingPoints, platform }: CraftRequest = await req.json();

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

    const prompt = buildPrompt(lead, tone, sampleText, talkingPoints, platform);

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

    const messages = parseMessages(content, platform);

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
  sampleText?: string,
  talkingPoints?: string,
  platform?: 'whatsapp' | 'email' | 'linkedin'
): string {
  const toneDescriptions: Record<string, string> = {
    professional: 'formal, business-appropriate, serious',
    friendly: 'warm, personable, conversational',
    casual: 'relaxed, informal, down-to-earth',
    'sales-focused': 'direct, benefit-driven, action-oriented',
    creative: 'unique, innovative, engaging'
  };

  const basePrompt = `You are an expert B2B sales copywriter. Craft personalized outreach messages for this lead:

LEAD INFORMATION:
- Name: ${lead.firstName} ${lead.lastName}
- Title: ${lead.title}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Location: ${lead.location}
- Company Size: ${lead.companySize}
- Email: ${lead.email}`;

  let styleGuidance = '';
  if (tone && sampleText) {
    styleGuidance = `

USER'S WRITING STYLE:
- Tone: ${toneDescriptions[tone] || tone}
- Sample of their writing: "${sampleText}"
${talkingPoints ? `- Key points to mention: ${talkingPoints}` : ''}

IMPORTANT: Match the user's tone and writing style EXACTLY. Copy their sentence structure, word choices, and general approach. Make it sound like THEM, not like generic AI-generated content.

Do NOT use em dashes (—), asterisks (*), or markdown formatting. Write natural, conversational text.`;
  } else {
    styleGuidance = `

Make each message personalized to the lead's role, company, and industry. Be concise, value-focused, and include clear CTAs.

Do NOT use em dashes (—), asterisks (*), or markdown formatting. Write natural, conversational text.`;
  }

  let platformGuide = '';
  if (platform) {
    const platformName = platform === 'whatsapp' ? 'WhatsApp' : platform === 'email' ? 'Email' : 'LinkedIn/Social';
    platformGuide = `

Generate ONLY the ${platformName} message.`;
  } else {
    platformGuide = `

Create messages for all three platforms.`;
  }

  let messageFormat = '';
  if (platform === 'whatsapp') {
    messageFormat = `

WHATSAPP_MESSAGE:
Short, friendly, conversational. 2-3 sentences with occasional emojis appropriate for business context. Include a natural call-to-action.`;
  } else if (platform === 'email') {
    messageFormat = `

EMAIL_MESSAGE:
Subject: [compelling subject line]
Message: [Professional email body with personalized greeting, value proposition, and clear call-to-action]`;
  } else if (platform === 'linkedin') {
    messageFormat = `

LINKEDIN_MESSAGE:
Professional yet personable. 1-2 sentences with a hook that relates to their industry or role. Include a natural connection request or call-to-action.`;
  } else {
    messageFormat = `

Create EXACTLY 3 messages in this format:

WHATSAPP_MESSAGE:
Short, friendly, conversational. 2-3 sentences with occasional emojis appropriate for business context. Include a natural call-to-action.

---

EMAIL_MESSAGE:
Subject: [compelling subject line]
Message: [Professional email body with personalized greeting, value proposition, and clear call-to-action]

---

LINKEDIN_MESSAGE:
Professional yet personable. 1-2 sentences with a hook that relates to their industry or role. Include a natural connection request or call-to-action.`;
  }

  return basePrompt + styleGuidance + platformGuide + messageFormat;
}

function parseMessages(content: string, platform?: 'whatsapp' | 'email' | 'linkedin'): {
  whatsapp: string;
  email: string;
  linkedin: string;
} {
  try {
    let whatsapp = "";
    let email = "";
    let linkedin = "";

    if (platform) {
      // Parse single platform response
      content = content.replace(/WHATSAPP_MESSAGE:/gi, '').replace(/EMAIL_MESSAGE:/gi, '').replace(/LINKEDIN_MESSAGE:/gi, '').trim();
      if (platform === 'whatsapp') {
        whatsapp = content;
      } else if (platform === 'email') {
        email = content;
      } else if (platform === 'linkedin') {
        linkedin = content;
      }
    } else {
      // Parse all three platforms
      const sections = content.split(/---+/);

      sections.forEach(section => {
        if (section.includes("WHATSAPP")) {
          whatsapp = section
            .replace(/WHATSAPP_MESSAGE:/gi, "")
            .replace(/whatsapp/gi, "")
            .trim();
        }
        if (section.includes("EMAIL")) {
          email = section
            .replace(/EMAIL_MESSAGE:/gi, "")
            .replace(/email/gi, "")
            .trim();
        }
        if (section.includes("LINKEDIN") || section.includes("SOCIAL")) {
          linkedin = section
            .replace(/LINKEDIN_MESSAGE:/gi, "")
            .replace(/SOCIAL.*MESSAGE:/gi, "")
            .replace(/linkedin/gi, "")
            .replace(/social/gi, "")
            .trim();
        }
      });
    }

    return {
      whatsapp: whatsapp || "Hi! I noticed your company and thought we could explore some opportunities together. Would love to chat sometime?",
      email: email || "Subject: Quick question about your services\n\nHi, I noticed your company and thought we could explore opportunities together. Would love to learn more about your needs.",
      linkedin: linkedin || "Hi, I came across your profile and was impressed by your work at " + (typeof window !== 'undefined' ? '' : 'your company') + ". Would love to connect and discuss how we might help each other."
    };
  } catch (error) {
    console.error("[CRAFT_MESSAGES] Parse error:", error);
    return {
      whatsapp: "Hi! I noticed your company and thought we could explore some opportunities together. Would love to chat sometime?",
      email: "Subject: Quick question about your services\n\nHi, I noticed your company and thought we could explore opportunities together. Would love to learn more about your needs.",
      linkedin: "Hi, I came across your profile and was impressed by your work. Would love to connect and discuss how we might help each other."
    };
  }
}
