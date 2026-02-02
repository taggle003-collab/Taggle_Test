// Email Service for Lead Notifications
// Integrates with Resend for sending lead details and tracking

import { Lead, LeadSearchResult } from './lead-types';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface LeadEmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  leadData: Lead | LeadSearchResult;
}

// Format lead data for email
const formatLeadForEmail = (lead: Lead | LeadSearchResult): string => {
  const leadName = 'name' in lead 
    ? lead.name 
    : `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    
  const leadEmail = lead.email || 'N/A';
  const leadPhone = ('phone' in lead ? lead.phone : undefined) || 'N/A';
  const leadCompany = ('company' in lead ? lead.company : undefined) || 'N/A';
  const leadTitle = ('title' in lead ? lead.title : undefined) || 'N/A';
  const leadIndustry = ('industry' in lead ? lead.industry : 'category' in lead ? lead.category : undefined) || 'N/A';
  const leadLocation = ('location' in lead ? lead.location : 'country' in lead ? lead.country : undefined) || 'N/A';
  const leadWebsite = ('website' in lead ? lead.website : undefined) || 'N/A';
  const leadOpenHours = ('openHours' in lead ? lead.openHours : undefined) || 'N/A';
  
  const socialMediaRaw = 'socialMedia' in lead ? lead.socialMedia : undefined;
  const socialLinks = socialMediaRaw ? 
    (typeof socialMediaRaw === 'string' 
      ? socialMediaRaw.split(/[,\n;]/).filter(Boolean)
      : Array.isArray(socialMediaRaw) ? socialMediaRaw : [])
    : [];
  
  return `
# Lead Details

**Name:** ${leadName}
**Company:** ${leadCompany}
**Title:** ${leadTitle}
**Email:** ${leadEmail}
**Phone:** ${leadPhone}
**Industry:** ${leadIndustry}
**Location:** ${leadLocation}
**Website:** ${leadWebsite}
**Open Hours:** ${leadOpenHours}

## Social Media
${socialLinks.length > 0
  ? socialLinks.map((link: string) => `- ${link.trim()}`).join('\n')
  : 'No social media links available'
}

## Additional Information
${'companySize' in lead && lead.companySize ? `- Company Size: ${lead.companySize}` : ''}
${'matchedCriteria' in lead && lead.matchedCriteria ? `- Matched Criteria: ${lead.matchedCriteria.join(', ')}` : ''}
${'matchQualityScore' in lead && lead.matchQualityScore ? `- Quality Score: ${lead.matchQualityScore}/100` : ''}
`.trim();
};

// Generate HTML email template
const generateLeadEmailHTML = (lead: Lead | LeadSearchResult): string => {
  const leadName = 'name' in lead 
    ? lead.name 
    : `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  
  const socialMediaRaw = 'socialMedia' in lead ? lead.socialMedia : undefined;
  const socialLinks: string[] = socialMediaRaw
    ? (typeof socialMediaRaw === 'string' 
        ? socialMediaRaw.split(/[,\n;]/).filter(Boolean)
        : Array.isArray(socialMediaRaw) ? socialMediaRaw : [])
    : [];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF6B35, #FF8B55); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
    .lead-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .lead-item { margin: 10px 0; }
    .lead-label { font-weight: bold; color: #FF6B35; }
    .social-links { margin: 10px 0; }
    .social-link { display: inline-block; margin: 5px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 3px; font-size: 12px; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Lead Generated</h1>
      <p>A new lead has been scraped and is ready for follow-up</p>
    </div>
    
    <div class="content">
      <div class="lead-details">
        <h2>Lead Information</h2>
        
        <div class="lead-item">
          <span class="lead-label">Name:</span> ${leadName}
        </div>
        
        <div class="lead-item">
          <span class="lead-label">Company:</span> ${'company' in lead ? lead.company || 'N/A' : 'N/A'}
        </div>
        
        <div class="lead-item">
          <span class="lead-label">Title:</span> ${'title' in lead ? lead.title || 'N/A' : 'N/A'}
        </div>
        
        <div class="lead-item">
          <span class="lead-label">Email:</span> 
          <a href="mailto:${lead.email}">${lead.email}</a>
        </div>
        
        <div class="lead-item">
          <span class="lead-label">Phone:</span> ${'phone' in lead ? lead.phone || 'N/A' : 'N/A'}
        </div>
        
        <div class="lead-item">
          <span class="lead-label">Industry:</span> ${'industry' in lead ? lead.industry || 'N/A' : lead.category || 'N/A'}
        </div>
        
        <div class="lead-item">
          <span class="lead-label">Location:</span> ${'location' in lead ? lead.location || 'N/A' : lead.country || 'N/A'}
        </div>
        
        ${'website' in lead && lead.website ? `
        <div class="lead-item">
          <span class="lead-label">Website:</span> 
          <a href="${lead.website}" target="_blank">${lead.website}</a>
        </div>
        ` : ''}
        
        ${'openHours' in lead && lead.openHours ? `
        <div class="lead-item">
          <span class="lead-label">Open Hours:</span> ${lead.openHours}
        </div>
        ` : ''}
        
        ${socialLinks.length > 0 ? `
        <div class="lead-item">
          <span class="lead-label">Social Media:</span>
          <div class="social-links">
            ${socialLinks.map(link => `
              <a href="${link.trim()}" class="social-link" target="_blank">
                ${new URL(link.trim()).hostname.replace('www.', '')}
              </a>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
      
      ${'companySize' in lead || 'matchedCriteria' in lead ? `
      <div class="lead-details">
        <h3>Additional Details</h3>
        ${'companySize' in lead ? `
        <div class="lead-item">
          <span class="lead-label">Company Size:</span> ${lead.companySize || 'N/A'}
        </div>
        ` : ''}
        
        ${'matchedCriteria' in lead ? `
        <div class="lead-item">
          <span class="lead-label">Matched Criteria:</span> ${lead.matchedCriteria?.join(', ') || 'N/A'}
        </div>
        ` : ''}
        
        ${'matchQualityScore' in lead ? `
        <div class="lead-item">
          <span class="lead-label">Quality Score:</span> ${lead.matchQualityScore || 'N/A'}/100
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <div class="footer">
        <p>This lead was automatically generated by LeadSync Pro</p>
        <p>Date: ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}

// Send lead details to user's email
export const sendLeadEmail = async (
  lead: Lead | LeadSearchResult,
  userEmail: string,
  _userName?: string
): Promise<EmailSendResult> => {
  try {
    const leadName = 'name' in lead 
      ? lead.name 
      : `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    
    const subject = `New Lead: ${leadName} - ${'company' in lead ? lead.company || 'Unknown Company' : 'Unknown Company'}`;
    const _textContent = formatLeadForEmail(lead);
    const _htmlContent = generateLeadEmailHTML(lead);
    
    // In a real implementation, this would call the Resend API
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: `LeadSync Pro <${process.env.FROM_EMAIL || 'leads@yourapp.com'}>`,
    //     to: userEmail,
    //     subject,
    //     text: textContent,
    //     html: htmlContent,
    //   }),
    // });
    
    // For demo purposes, log the email details
    console.log('[Email Service] Sending lead email:', {
      to: userEmail,
      subject,
      lead: leadName,
    });
    
    // Simulate successful send
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
    };
  } catch (error) {
    console.error('[Email Service] Failed to send lead email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Send batch email with multiple leads
export const sendBatchLeadEmail = async (
  leads: (Lead | LeadSearchResult)[],
  userEmail: string,
  batchName?: string
): Promise<EmailSendResult> => {
  try {
    const subject = batchName 
      ? `Lead Batch: ${batchName} - ${leads.length} leads`
      : `Lead Batch Update - ${leads.length} new leads`;
    
    // Create summary text
    const _textContent = `
Lead Batch Report
=================

Batch: ${batchName || 'Unnamed Batch'}
Total Leads: ${leads.length}
Date: ${new Date().toLocaleString()}

Lead Summary:
${leads.map((lead, index) => {
  const leadName = 'name' in lead 
    ? lead.name 
    : `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return `${index + 1}. ${leadName} - ${'company' in lead ? lead.company || 'Unknown' : 'Unknown'}`;
}).join('\n')}

Full details available in your dashboard.
`.trim();
    
    // In a real implementation, this would create a more detailed HTML email
    console.log('[Email Service] Sending batch lead email:', {
      to: userEmail,
      subject,
      leadsCount: leads.length,
    });
    
    return {
      success: true,
      messageId: `batch_${Date.now()}`,
    };
  } catch (error) {
    console.error('[Email Service] Failed to send batch email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Track email engagement
export const trackEmailEngagement = (messageId: string, event: 'open' | 'click'): void => {
  console.log(`[Email Service] Email ${messageId} ${event}ed`);
  // In a real implementation, this would update tracking data in your database
};

// Get email sending quota (plan-based)
export const getEmailQuota = (userPlan: 'lite' | 'solo' | 'pro'): { daily: number; monthly: number } => {
  switch (userPlan) {
    case 'lite':
      return { daily: 10, monthly: 100 };
    case 'solo':
      return { daily: 50, monthly: 1000 };
    case 'pro':
      return { daily: 500, monthly: 10000 };
    default:
      return { daily: 10, monthly: 100 };
  }
};

// Check if user can send more emails
export const canSendEmail = async (userId: string, userPlan: 'lite' | 'solo' | 'pro'): Promise<boolean> => {
  // In a real implementation, this would check against database records
  // of emails sent in the current period
  const quota = getEmailQuota(userPlan);
  console.log(`[Email Service] Checking quota for user ${userId}: ${quota.daily} daily, ${quota.monthly} monthly`);
  return true; // Simplified for demo
};
