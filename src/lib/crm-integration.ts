// CRM Integration Helpers for Lead Management
// Integrates leads with CRM contacts, companies, and interactions

import { Lead, LeadSearchResult } from './lead-types';

export interface CRMContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  companyId?: string;
  leadSource?: string;
  leadScore?: number;
  lastContact?: string;
  interactionCount: number;
  tags: string[];
}

export interface CRMCompany {
  id: string;
  name: string;
  industry?: string;
  location?: string;
  website?: string;
  companySize?: string;
  annualRevenue?: string;
  contactIds: string[];
  leadScore?: number;
}

export interface CRMInteraction {
  id: string;
  contactId: string;
  type: 'email' | 'call' | 'meeting' | 'note';
  direction: 'outbound' | 'inbound';
  subject: string;
  content: string;
  timestamp: string;
  outcome?: string;
}

// Convert lead to CRM contact
export const convertLeadToCRMContact = (
  lead: Lead | LeadSearchResult,
  leadScore?: number
): CRMContact => {
  const leadEmail = lead.email || '';
  
  return {
    id: `crm_${lead.id}`,
    name: 'name' in lead ? lead.name : `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
    email: leadEmail,
    phone: 'phone' in lead ? lead.phone : undefined,
    title: 'title' in lead ? lead.title : undefined,
    companyId: 'company' in lead && lead.company ? `company_${lead.company}` : undefined,
    leadSource: 'source' in lead ? lead.source : 'lead-scraper',
    leadScore,
    interactionCount: 0,
    tags: ['lead', 'imported'],
  };
};

// Convert lead to CRM company
export const convertLeadToCRMCompany = (lead: Lead | LeadSearchResult): CRMCompany => {
  const companyName = ('company' in lead ? lead.company : undefined) || 'Unknown Company';
  return {
    id: `company_${companyName}`,
    name: companyName,
    industry: ('industry' in lead ? lead.industry : undefined) || 'Not specified',
    location: ('location' in lead ? lead.location : undefined) || 'Not specified',
    website: ('website' in lead ? lead.website : undefined) || 'Not available',
    companySize: 'companySize' in lead ? lead.companySize : undefined,
    contactIds: [],
  };
};

// Create interaction from email send
export const createEmailInteraction = (
  contactId: string,
  subject: string,
  content: string,
  outcome?: string
): CRMInteraction => {
  return {
    id: `interaction_${Date.now()}`,
    contactId,
    type: 'email',
    direction: 'outbound',
    subject,
    content,
    timestamp: new Date().toISOString(),
    outcome,
  };
};

// Track email open (simulated)
export const trackEmailOpen = (interactionId: string): void => {
  // In a real implementation, this would update the interaction
  // with open tracking data via webhook or API call
  console.log(`[CRM] Email interaction ${interactionId} was opened`);
};

// Update contact interaction count
export const updateContactInteractionCount = (contactId: string, increment: number = 1): void => {
  // In a real implementation, this would update the contact record
  // in the CRM database
  console.log(`[CRM] Updated interaction count for contact ${contactId} by ${increment}`);
};

// Add tag to contact
export const addContactTag = (contactId: string, tag: string): void => {
  // In a real implementation, this would add a tag to the contact
  console.log(`[CRM] Added tag "${tag}" to contact ${contactId}`);
};

// Get contacts by tag
export const getContactsByTag = (contacts: CRMContact[], tag: string): CRMContact[] => {
  return contacts.filter(contact => contact.tags.includes(tag));
};

// Get leads ready for automation
export const getLeadsForAutomation = (
  contacts: CRMContact[], 
  minScore: number = 60,
  maxInteractions: number = 0
): CRMContact[] => {
  return contacts.filter(contact => 
    (contact.leadScore || 0) >= minScore && 
    contact.interactionCount <= maxInteractions &&
    contact.email // Must have email
  );
};

// Track lead source performance
export interface LeadSourcePerformance {
  source: string;
  totalLeads: number;
  convertedContacts: number;
  avgLeadScore: number;
  conversionRate: number;
}

export const analyzeLeadSourcePerformance = (contacts: CRMContact[]): LeadSourcePerformance[] => {
  const performance: Record<string, LeadSourcePerformance> = {};
  
  contacts.forEach(contact => {
    const source = contact.leadSource || 'unknown';
    if (!performance[source]) {
      performance[source] = {
        source,
        totalLeads: 0,
        convertedContacts: 0,
        avgLeadScore: 0,
        conversionRate: 0,
      };
    }
    
    performance[source].totalLeads++;
    if (contact.interactionCount > 0) {
      performance[source].convertedContacts++;
    }
    performance[source].avgLeadScore += contact.leadScore || 0;
  });
  
  // Calculate averages and rates
  return Object.values(performance).map(source => ({
    ...source,
    avgLeadScore: Math.round(source.avgLeadScore / source.totalLeads),
    conversionRate: Math.round((source.convertedContacts / source.totalLeads) * 100),
  })).sort((a, b) => b.conversionRate - a.conversionRate);
};

