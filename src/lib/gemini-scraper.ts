import { GoogleGenerativeAI } from "@google/generative-ai";
import { ScrapedLead, ICPCriteria } from "./scrapers/base-scraper";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function generateLeadsWithGemini(criteria: ICPCriteria): Promise<ScrapedLead[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `Generate exactly 10 realistic business leads as JSON.

Criteria:
- Industry: ${criteria.industry}
- Location: ${criteria.location || "USA"}
- Job Titles: ${criteria.jobTitles?.join(", ") || "CEO, Director, Manager"}
- Company Size: ${criteria.companySize || "Any"}

For each lead, return ONLY valid JSON array with this structure:
[
  {
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@company.com",
    "company": "Company Name",
    "title": "CEO",
    "location": "San Francisco, CA",
    "companySize": "50-100",
    "industry": "${criteria.industry}",
    "linkedInProfile": "https://linkedin.com/in/john-smith",
    "verified": false,
    "accuracy": 85,
    "founderName": "Founder Name",
    "founderTitle": "Founder",
    "founderImage": "https://i.pravatar.cc/150?u=company",
    "matchedCriteria": ["industry", "location", "title"],
    "source": "gemini-generated",
    "sourceUrl": "https://gemini.google.com"
  }
]

Generate exactly 10 leads. Return ONLY the JSON array, no markdown or explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    
    const leads = JSON.parse(jsonMatch[0]);
    return leads.slice(0, 10); // Ensure exactly 10
  } catch (error) {
    console.error("[GEMINI] Lead generation failed:", error);
    return [];
  }
}