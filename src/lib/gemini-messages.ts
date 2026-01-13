import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedLead } from "./scrapers/base-scraper";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function craftMessageWithGemini(lead: ScrapedLead, channel: "email" | "whatsapp"): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const basePrompt = `You are a professional sales executive with 10+ years of experience. Write a personalized outreach ${channel} to this lead.

Lead:
- Name: ${lead.firstName} ${lead.lastName}
- Company: ${lead.company}
- Title: ${lead.title}
- Industry: ${lead.industry}

IMPORTANT RULES:
- Use natural, conversational language
- Sound human, not robotic
- NO em dashes (—)
- NO generic acknowledgements like "Hope you're doing well"
- NO formal/heavy English
- Get straight to the point
- Show value first
- Keep it short (3-4 sentences for WhatsApp, 4-5 for email)
- Be personal but professional

${channel === "email" ? "Include subject line at the top: [Subject: ...]" : ""}

Write ONLY the message, nothing else.`;

  try {
    const result = await model.generateContent(basePrompt);
    return result.response.text();
  } catch (error) {
    console.error("[GEMINI] Message crafting failed:", error);
    return "";
  }
}