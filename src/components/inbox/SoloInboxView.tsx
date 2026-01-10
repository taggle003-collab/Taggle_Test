'use client';

import { useState, useEffect } from 'react';
import { LeadBatch, ScrapedLead, LimitedInsights } from '../../../lib/inbox-types';

// Inline functions to avoid import issues
const deleteLeadBatch = (batchId: string): boolean => {
  try {
    const STORAGE_KEY = 'taggle_lead_batches';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    const batches = JSON.parse(stored);
    const filteredBatches = batches.filter((batch: any) => batch.id !== batchId);
    
    if (batches.length === filteredBatches.length) {
      return false; // Batch not found
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredBatches));
    return true;
  } catch (error) {
    console.error('Error deleting batch:', error);
    return false;
  }
};

const generateInsights = (batch: LeadBatch, planLevel: 'basic' | 'limited' | 'full'): LimitedInsights => {
  try {
    const basic = {
      totalLeads: batch.totalLeads,
      verificationRate: Math.round((batch.stats.verifiedCount / batch.totalLeads) * 100),
      batchCreatedDate: new Date(batch.createdAt),
    };

    if (planLevel === 'basic') {
      return basic as LimitedInsights;
    }

    // Add more insights for limited and full plans
    return {
      ...basic,
      qualityBreakdown: {
        verified: batch.stats.verifiedCount,
        highQuality: Math.floor(batch.totalLeads * 0.3),
        mediumQuality: Math.floor(batch.totalLeads * 0.4),
        lowQuality: Math.floor(batch.totalLeads * 0.3),
      },
    } as LimitedInsights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      totalLeads: batch.totalLeads,
      verificationRate: 0,
      batchCreatedDate: new Date(),
    } as LimitedInsights;
  }
};
import { LeadTable } from './LeadTable';
import { ExportMenu } from './ExportMenu';
import { QualityBreakdownChart } from './QualityBreakdownChart';
import { DistributionChart } from './DistributionChart';
import { RecommendationsCard } from './RecommendationsCard';

interface SoloInboxViewProps {
  batch: LeadBatch;
  onDeleteBatch: (batchId: string) => void;
  userEmail: string;
  onRefresh: () => void;
}

export function SoloInboxView({ batch, onDeleteBatch, userEmail, onRefresh }: SoloInboxViewProps) {
  const [leads, setLeads] = useState<ScrapedLead[]>(batch.leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [insights, setInsights] = useState<LimitedInsights | null>(null);

  // Calculate insights on mount
  useEffect(() => {
    const calculatedInsights = generateInsights(batch, 'limited');
    setInsights(calculatedInsights as LimitedInsights);
  }, [batch]);

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
      const response = await fetch('/api/inbox/send-batch-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: batch.id,
          email: userEmail,
          planLevel: 'limited',
        }),
      });
      
      if (response.ok) {
        alert('Email sent with insights summary!');
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
    const headers = ['Name', 'Email', 'Company', 'Title', 'Location', 'Verified', 'Quality Score'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.company,
      lead.title,
      lead.location,
      lead.verified ? 'Yes' : 'No',
      lead.matchQualityScore || 'N/A',
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
              <span>•</span>
              <span>{insights?.icpMatchPercentage || 0}% ICP Match</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Send Email Button */}
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {isSendingEmail ? 'Sending...' : 'Email Insights'}
            </button>
            
            {/* Export CSV Button */}
            <ExportMenu 
              onExportCSV={handleExportCSV}
              onExportPDF={() => {}} // PDF export not available in Solo
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

      {/* Insights Section - Only for Solo Plan */}
      {insights && (
        <div className="space-y-6">
          {/* Quality Breakdown & ICP Match */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QualityBreakdownChart insights={insights} />
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">ICP Match Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Match Rate</span>
                  <span className="text-2xl font-bold text-[#FF6B35]">{insights.icpMatchPercentage}%</span>
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round((insights.icpMatchPercentage / 100) * batch.totalLeads)} leads matched your ICP criteria
                </div>
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="text-sm font-medium text-white mb-2">Top Performing Industry</div>
                  {insights.topIndustry ? (
                    <div>
                      <div className="font-medium text-[#FF6B35]">{insights.topIndustry.industry}</div>
                      <div className="text-xs text-gray-400">Avg quality: {insights.topIndustry.avgQuality}%</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No clear industry leader</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.industryDistribution.length > 0 && (
              <DistributionChart
                title="Industry Distribution"
                data={insights.industryDistribution.slice(0, 8)}
                type="pie"
              />
            )}
            {insights.companySizeDistribution.length > 0 && (
              <DistributionChart
                title="Company Size Distribution"
                data={insights.companySizeDistribution.slice(0, 8)}
                type="bar"
              />
            )}
          </div>

          {/* Top Locations & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Locations</h3>
              <div className="space-y-2">
                {insights.topLocations.slice(0, 5).map((location, index) => (
                  <div key={location.location} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                      <span className="text-white">{location.location}</span>
                    </div>
                    <span className="text-sm text-gray-400">{location.count} leads</span>
                  </div>
                ))}
              </div>
            </div>
            
            {insights.recommendations.length > 0 && (
              <RecommendationsCard recommendations={insights.recommendations} />
            )}
          </div>
        </div>
      )}

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
          showQualityScore={true}
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
            <div className="flex justify-between">
              <span className="text-gray-400">ICP Match:</span>
              <span className="text-[#FF6B35] font-medium">{insights?.icpMatchPercentage || 0}%</span>
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
              <span className="text-white">CSV with Quality Scores</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Insights Level:</span>
              <span className="text-[#FF6B35] font-medium">Solo Plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}