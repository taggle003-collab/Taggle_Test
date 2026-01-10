'use client';

import { useState } from 'react';
import { LeadBatch, ScrapedLead } from '../../../lib/inbox-types';
import { deleteLeadBatch } from '../../../lib/inbox-utils';
import { LeadTable } from './LeadTable';
import { ExportMenu } from './ExportMenu';

interface LiteInboxViewProps {
  batch: LeadBatch;
  onDeleteBatch: (batchId: string) => void;
  userEmail: string;
}

export function LiteInboxView({ batch, onDeleteBatch, userEmail }: LiteInboxViewProps) {
  const [leads, setLeads] = useState<ScrapedLead[]>(batch.leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Get unique industries for filter
  const industries = Array.from(new Set(batch.leads
    .map(lead => lead.industry || 'Unknown')
    .filter(Boolean)
  )).sort();

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIndustry = !selectedIndustry || 
      (lead.industry === selectedIndustry);
    
    return matchesSearch && matchesIndustry;
  });

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      // Call email API
      const response = await fetch('/api/inbox/send-batch-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: batch.id,
          email: userEmail,
          planLevel: 'basic',
        }),
      });
      
      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      deleteLeadBatch(batch.id);
      onDeleteBatch(batch.id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Title', 'Location', 'Verified'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.company,
      lead.title,
      lead.location,
      lead.verified ? 'Yes' : 'No',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.name}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate batch stats
  const verifiedCount = filteredLeads.filter(lead => lead.verified).length;
  const verificationRate = Math.round((verifiedCount / filteredLeads.length) * 100);

  return (
    <div className="p-6 space-y-6">
      {/* Batch Header Info */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{batch.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span>Created: {new Date(batch.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{batch.totalLeads} total leads</span>
              <span>•</span>
              <span>{verifiedCount} verified ({verificationRate}%)</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Send Email Button */}
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {isSendingEmail ? 'Sending...' : 'Email to Inbox'}
            </button>
            
            {/* Export CSV Button */}
            <ExportMenu 
              onExportCSV={handleExportCSV}
              onExportPDF={() => {}} // PDF export not available in Lite
              showPDF={false}
            />
            
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Delete Batch
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          
          {/* Industry Filter */}
          <div className="sm:w-48">
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center text-sm text-gray-400">
            Showing {filteredLeads.length} of {batch.totalLeads} leads
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden">
        <LeadTable 
          leads={filteredLeads}
          showQualityScore={false}
          showEngagementScore={false}
        />
      </div>

      {/* Batch Metadata */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Batch Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-white">{new Date(batch.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Leads:</span>
              <span className="text-white">{batch.totalLeads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Verified:</span>
              <span className="text-white">{verifiedCount} ({verificationRate}%)</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery Method:</span>
              <span className="text-white">
                {batch.deliveryMethods.email ? 'Email' : 'In-App'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ICP Criteria:</span>
              <span className="text-white">
                {batch.icpCriteria?.industry ? batch.icpCriteria.industry.join(', ') : 'Custom'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Export Available:</span>
              <span className="text-white">CSV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}