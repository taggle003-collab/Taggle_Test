import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { email, leads, criteria } = await req.json();

    if (!email || !leads || leads.length === 0) {
      return new NextResponse("Missing data", { status: 400 });
    }

    // In a real app, you would use a service like Resend, Postmark, or SendGrid
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'taggle@taggle.co.in',
    //   to: email,
    //   subject: 'Your Scraped Leads from Taggle',
    //   html: renderTemplate(leads, criteria)
    // });

    console.log(`Sending leads to ${email} from taggle@taggle.co.in`);
    console.log(`Criteria used:`, criteria);
    console.log(`Number of leads: ${leads.length}`);

    // Professional email template (simulated)
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px; border: 1px solid #ea580c;">
        <h1 style="color: #ea580c;">Taggle</h1>
        <h2>Your Scraped Leads</h2>
        <p>Here are the leads we found based on your Ideal Customer Profile:</p>
        
        <div style="background: #111; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #ea580c;">Search Criteria</h3>
          <p><strong>Industry:</strong> ${criteria.industry}</p>
          <p><strong>Location:</strong> ${criteria.location}</p>
          <p><strong>Company Size:</strong> ${criteria.companySize}</p>
          <p><strong>Job Titles:</strong> ${criteria.jobTitles}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #ea580c; text-align: left;">
              <th style="padding: 10px;">Name</th>
              <th style="padding: 10px;">Company</th>
              <th style="padding: 10px;">Email</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map((l: any) => `
              <tr style="border-bottom: 1px solid #333;">
                <td style="padding: 10px;">${l.name}<br/><span style="font-size: 12px; color: #888;">${l.title}</span></td>
                <td style="padding: 10px;">${l.company}</td>
                <td style="padding: 10px; color: #ea580c;">${l.email}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center;">
          <a href="https://taggle.co.in/dashboard" style="background: #ea580c; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Return to Dashboard</a>
        </div>
      </div>
    `;

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SEND_EMAIL_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
