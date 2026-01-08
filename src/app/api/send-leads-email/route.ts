import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, leads, userName, userEmail } = await request.json();

    if (!email || !leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: "Missing required fields: email, leads" },
        { status: 400 }
      );
    }

    // Check if Resend API key is available
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    // Dynamic import to avoid build-time issues
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    // Generate CSV content from leads
    const csvHeaders = "Name,Email,Company,Phone,Position,Location\n";
    const csvRows = leads
      .map((lead: any) =>
        [
          lead.name || "",
          lead.email || "",
          lead.company || "",
          lead.phone || "",
          lead.position || "",
          lead.location || "",
        ]
          .map((field: string) => `"${field.replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const csvContent = csvHeaders + csvRows;

    // Generate HTML table for email
    const htmlTable = `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f97316; color: white;">
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Name</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Email</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Company</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Phone</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Position</th>
            <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Location</th>
          </tr>
        </thead>
        <tbody>
          ${leads
            .map(
              (lead: any) => `
            <tr style="background-color: #f9fafb;">
              <td style="padding: 10px; border: 1px solid #ddd;">${lead.name || ""}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${lead.email || ""}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${lead.company || ""}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${lead.phone || ""}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${lead.position || ""}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${lead.location || ""}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;

    // Create email content
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f97316; font-size: 28px; margin-bottom: 10px;">🏢 Taggle</h1>
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 10px;">Your Scraped Leads</h2>
          <p style="color: #6b7280; font-size: 16px;">
            Here are the leads you scraped from your dashboard on ${new Date().toLocaleDateString()}
          </p>
        </div>

        <div style="background-color: #fff7ed; border: 2px solid #f97316; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="color: #f97316; margin-top: 0; margin-bottom: 15px;">📊 Summary</h3>
          <p style="margin: 5px 0; color: #374151;"><strong>Total Leads:</strong> ${leads.length}</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Scraped for:</strong> ${userName || "User"} (${userEmail || "No email"})</p>
          <p style="margin: 5px 0; color: #374151;"><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>

        ${htmlTable}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            Thank you for using Taggle for your lead generation needs!
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-url.com'}/dashboard" 
             style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `;

    // Send email with Resend
    const result = await resend.emails.send({
      from: "Taggle <taggle@taggle.co.in>",
      to: [email],
      subject: `🏢 Your ${leads.length} Taggle Leads (${new Date().toLocaleDateString()})`,
      html: emailHtml,
      attachments: [
        {
          filename: `taggle-leads-${new Date().toISOString().split('T')[0]}.csv`,
          content: Buffer.from(csvContent).toString("base64"),
        },
      ],
    });

    if (result.error) {
      console.error("Resend API error:", result.error);
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error("Error sending leads email:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}