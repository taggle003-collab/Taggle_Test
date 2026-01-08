import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAIL = "taggle003@gmail.com";

function generateEmailHtml(leads: any[], criteria: any, page?: number, total?: number) {
  const jobTitlesText = Array.isArray(criteria.jobTitles) 
    ? criteria.jobTitles.join(", ") 
    : criteria.jobTitles;

  const pageInfo = page && total ? ` (Page ${page})` : '';
  const totalInfo = total ? ` out of ${total} total leads found` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Scraped Leads from Taggle</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a1a; color: #ffffff; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #FF6B35;">
            <h1 style="color: #FF6B35; font-size: 32px; margin: 0; font-weight: bold; letter-spacing: 2px;">TAGGLE</h1>
            <p style="color: #888; font-size: 14px; margin: 10px 0 0 0;">Intelligent Lead Generation</p>
          </div>

          <!-- Title -->
          <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px; font-weight: 600;">Your Scraped Leads${pageInfo}</h2>
          <p style="color: #aaa; margin-bottom: 30px;">Here are ${leads.length} leads${totalInfo} based on your Ideal Customer Profile:</p>

          <!-- ICP Criteria Card -->
          <div style="background: #000; padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #FF6B35/30;">
            <h3 style="color: #FF6B35; font-size: 18px; margin: 0 0 20px 0; font-weight: 600; border-bottom: 1px solid #FF6B35/30; padding-bottom: 10px;">
              🔍 Search Criteria
            </h3>
            <div style="color: #ccc; font-size: 14px; line-height: 1.8;">
              ${criteria.customICP ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Custom ICP:</strong> ${criteria.customICP}</p>` : ''}
              ${criteria.industry ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Industry:</strong> ${criteria.industry}</p>` : ''}
              ${criteria.location ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Location:</strong> ${criteria.location}</p>` : ''}
              ${criteria.companySize ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Company Size:</strong> ${criteria.companySize} employees</p>` : ''}
              ${jobTitlesText && jobTitlesText.length > 0 ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Job Titles:</strong> ${jobTitlesText}</p>` : ''}
              ${criteria.annualRevenue ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Annual Revenue:</strong> ${criteria.annualRevenue}</p>` : ''}
              ${criteria.fundingStage ? `<p style="margin: 5px 0;"><strong style="color: #FF6B35;">Funding Stage:</strong> ${criteria.fundingStage}</p>` : ''}
              <p style="margin: 15px 0 0 0; padding-top: 10px; border-top: 1px solid #333; color: #888; font-size: 12px;">
                <strong>Scraped on:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <!-- Leads Table -->
          <div style="overflow-x: auto; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; background: #000; border-radius: 12px; overflow: hidden;">
              <thead>
                <tr style="background: #FF6B35; color: #ffffff;">
                  <th style="padding: 15px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Founder</th>
                  <th style="padding: 15px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Lead Name</th>
                  <th style="padding: 15px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company</th>
                  <th style="padding: 15px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Email</th>
                </tr>
              </thead>
              <tbody>
                ${leads.map((lead, index) => `
                  <tr style="border-bottom: 1px solid #333; ${index % 2 === 0 ? 'background: #0a0a0a;' : 'background: #111;'}">
                    <td style="padding: 15px; color: #ffffff;">
                      <div style="display: flex; align-items: center; gap: 10px;">
                        ${lead.founderImage ? `<img src="${lead.founderImage}" alt="${lead.founderName}" style="width: 30px; height: 30px; border-radius: 50%; border: 1px solid #FF6B35;">` : ''}
                        <div style="font-size: 12px;">
                          <div style="font-weight: 600;">${lead.founderName}</div>
                          <div style="color: #888; font-size: 10px;">${lead.founderTitle}</div>
                        </div>
                      </div>
                    </td>
                    <td style="padding: 15px; color: #ffffff;">
                      <div style="font-weight: 600;">${lead.firstName} ${lead.lastName}</div>
                      <div style="color: #888; font-size: 11px;">${lead.title}</div>
                    </td>
                    <td style="padding: 15px; color: #ccc;">${lead.company}</td>
                    <td style="padding: 15px;">
                      <a href="mailto:${lead.email}" style="color: #FF6B35; text-decoration: none; font-weight: 500;">${lead.email}</a>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://taggle.co.in'}/dashboard" 
               style="display: inline-block; background: #FF6B35; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);">
              → Return to Dashboard
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 30px; border-top: 1px solid #333; color: #888; font-size: 12px; line-height: 1.8;">
            <p style="margin: 5px 0;">This email was sent by <strong style="color: #FF6B35;">Taggle</strong></p>
            <p style="margin: 5px 0;">Powered by intelligent lead generation technology</p>
            <p style="margin: 15px 0 0 0; color: #666;">© ${new Date().getFullYear()} Taggle. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;

    // Check if user is authorized (admin or the same user who made the request)
    if (userEmail !== ADMIN_EMAIL) {
      // For non-admin users, only allow them to send to their own email
      const { email } = await req.json();
      if (email !== userEmail) {
        return new NextResponse("You can only send leads to your own email address", { status: 403 });
      }
    }

    const { email, leads, criteria, page, total } = await req.json();

    if (!email || !leads || leads.length === 0) {
      return new NextResponse("Missing data", { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("[SEND_EMAIL_ERROR] RESEND_API_KEY not configured");
      return new NextResponse("Email service not configured", { status: 500 });
    }

    const emailHtml = generateEmailHtml(leads, criteria, page, total);

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Taggle <taggle@taggle.co.in>',
        to: [email],
        subject: 'Your Scraped Leads from Taggle',
        html: emailHtml,
        replyTo: 'taggle@taggle.co.in',
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[SEND_EMAIL_ERROR] Resend API error:", errorText);
      return new NextResponse(`Failed to send email: ${errorText}`, { status: 500 });
    }

    const resendData = await resendResponse.json();
    console.log("[SEND_EMAIL_SUCCESS] Email sent:", resendData);

    return NextResponse.json({ 
      success: true, 
      messageId: resendData.id,
      email: email 
    });
  } catch (error) {
    console.error("[SEND_EMAIL_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
