'use client';

import { useState, useEffect } from 'react';
import { LeadBatch, ScrapedLead, FullInsights } from '../../../lib/inbox-types';

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

const generateInsights = (batch: LeadBatch, planLevel: 'basic' | 'limited' | 'full'): FullInsights => {
  try {
    const basic = {
      totalLeads: batch.totalLeads,
      verificationRate: Math.round((batch.stats.verifiedCount / batch.totalLeads) * 100),
      batchCreatedDate: new Date(batch.createdAt),
    };

    if (planLevel === 'basic') {
      return basic as FullInsights;
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
    } as FullInsights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      totalLeads: batch.totalLeads,
      verificationRate: 0,
      batchCreatedDate: new Date(),
    } as FullInsights;
  }
};
import { LeadTable } from './LeadTable';
import { ExportMenu } from './ExportMenu';
import { QualityBreakdownChart } from './QualityBreakdownChart';
import { DistributionChart } from './DistributionChart';
import { RecommendationsCard } from './RecommendationsCard';
import { AdvancedDashboard } from './AdvancedDashboard';

interface ProInboxViewProps {
  batch: LeadBatch;
  onDeleteBatch: (batchId: string) => void;
  userEmail: string;
  onRefresh: () => void;
}

export function ProInboxView({ batch, onDeleteBatch, userEmail, onRefresh }: ProInboxViewProps) {
  const [leads, setLeads] = useState<ScrapedLead[]>(batch.leads);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedQualityTier, setSelectedQualityTier] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [insights, setInsights] = useState<FullInsights | null>(null);

  // Calculate insights on mount
  useEffect(() => {
    const calculatedInsights = generateInsights(batch, 'full');
    setInsights(calculatedInsights as FullInsights);
  }, [batch]);

  // Get unique industries for filter
  const industries = Array.from(new Set(batch.leads
    .map(lead => lead.industry || 'Unknown')
    .filter(Boolean)
  )).sort();

  // Filter leads based on search, industry, and quality tier
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Industry filter
    const matchesIndustry = !selectedIndustry || 
      (lead.industry === selectedIndustry);
    
    // Quality tier filter
    const matchesQualityTier = !selectedQualityTier || (() => {
      switch (selectedQualityTier) {
        case 'high':
          return (lead.matchQualityScore || 0) >= 80;
        case 'medium':
          const score = lead.matchQualityScore || 0;
          return score >= 60 && score < 80;
        case 'low':
          return (lead.matchQualityScore || 100) < 60;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesIndustry && matchesQualityTier;
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
          planLevel: 'full',
        }),
      });
      
      if (response.ok) {
        alert('Detailed insights email sent with advanced analytics!');
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
    if (confirm('Are you sure you want to delete this Pro batch? This will remove all associated insights and data. This action cannot be undone.')) {
      deleteLeadBatch(batch.id);
      onDeleteBatch(batch.id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Company', 'Title', 'Location', 'Verified', 'Quality Score', 'Engagement Score', 'Industry', 'Company Size', 'Match Criteria'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.company,
      lead.title,
      lead.location,
      lead.verified ? 'Yes' : 'No',
      lead.matchQualityScore || 'N/A',
      lead.engagementScore || 'N/A',
      lead.industry || 'Unknown',
      lead.companySize || 'Unknown',
      lead.matchedCriteria ? lead.matchedCriteria.join('; ') : 'None',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.name}_pro.csv`;
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
              <span>•</span>
              <span className="text-[#FF6B35]">ROI Est: ${insights?.roiEstimate?.estimatedValue || 0}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* Send Email Button */}
            <button
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              className="bg-[#FF6B35] hover:bg-[#e55a2b] disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {isSendingEmail ? 'Sending...' : 'Send Advanced Report'}
            </button>
            
            {/* Export CSV Button */}
            <ExportMenu 
              onExportCSV={handleExportCSV}
              onExportPDF={() => {}} // PDF would require additional library
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

      {/* Insights Section - Full Pro Features */}
      {insights && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
              <div className="text-2xl font-bold text-[#FF6B35]">{insights.qualityTierFunnel.find(t => t.tier === 'High Quality')?.percentage || 0}%</div>
              <div className="text-sm text-gray-400">High Quality</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
              <div className="text-2xl font-bold text-[#FF6B35]">{insights.verificationRateWithConfidence.rate}%</div>
              <div className="text-sm text-gray-400">Verified (±{100 - insights.verificationRateWithConfidence.confidence}%)</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
              <div className="text-2xl font-bold text-[#FF6B35]">{insights.roiEstimate.estimatedConversion}%</div>
              <div className="text-sm text-gray-400">Est. Conversion</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
              <div className="text-2xl font-bold text-[#FF6B35]">${insights.roiEstimate.estimatedValue}</div>
              <div className="text-sm text-gray-400">Pipeline Value</div>
            </div>
          </div>

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
                  {Math.round((insights.icpMatchPercentage / 100) * batch.totalLeads)} leads matched ICP • {insights.qualityTierFunnel.reduce((sum, tier) => sum + tier.count, 0)} analyzed
                </div>
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="text-sm font-medium text-white mb-2">Top Performing Industry</div>
                  {insights.topIndustry ? (
                    <div>
                      <div className="font-medium text-[#FF6B35]">{insights.topIndustry.industry}</div>
                      <div className="text-xs text-gray-400">Avg quality: {insights.topIndustry.avgQuality}% • Engagement: {Math.round(batch.leads.filter(lead => lead.industry === insights.topIndustry?.industry).reduce((sum, lead) => sum + (lead.engagementScore || 0), 0) / batch.leads.filter(lead => lead.industry === insights.topIndustry?.industry).length)}%</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No clear industry leader</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Dashboard */}
          <AdvancedDashboard insights={insights} batch={batch} />

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.industryDistribution.length > 0 && (
              <DistributionChart
                title="Industry Distribution"
                data={insights.industryDistribution.slice(0, 8)}
                type="pie"
                onSliceClick={(industry) => console.log('Filter by:', industry)}
              />
            )}
            {insights.companySizeDistribution.length > 0 && (
              <DistributionChart
                title="Company Size Distribution"
                data={insights.companySizeDistribution.slice(0, 8)}
                type="bar"
                onBarClick={(size) => console.log('Filter by size:', size)}
              />
            )}
            {insights.jobTitleDistribution.length > 0 && (
              <DistributionChart
                title="Job Title Distribution"
                data={insights.jobTitleDistribution.slice(0, 8)}
                type="horizontal-bar"
                onBarClick={(title) => console.log('Filter by title:', title)}
              />
            )}
          </div>

          {/* Advanced Insights - Revenue & Funding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.revenueDistribution && insights.revenueDistribution.length > 0 && (
              <DistributionChart
                title="Revenue Distribution"
                data={insights.revenueDistribution}
                type="bar"
              />
            )}
            {insights.fundingStageDistribution && insights.fundingStageDistribution.length > 0 && (
              <DistributionChart
                title="Funding Stage Distribution"
                data={insights.fundingStageDistribution}
                type="pie"
              />
            )}
          </div>
        </div>
      )}

      {/* Filters with Quality Tier */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, company, title, email, or location..."
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
          
          {/* Quality Tier Filter */}
          <div className="sm:w-48">
            <select
              value={selectedQualityTier || ''}
              onChange={(e) => setSelectedQualityTier(e.target.value || null)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Quality</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (60-79%)</option>
              <option value="low">Low (&lt;60%)</option>
            </select>
          </div>
          
          <div className="flex items-center text-sm text-gray-400">
            Showing {filteredLeads.length} leads
          </div>
        </div>
      </div>

      {/* Leads Table with All Metrics */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden">
        <LeadTable 
          leads={filteredLeads}
          showQualityScore={true}
          showEngagementScore={true}
          onLeadClick={(leadId) => console.log('View lead details:', leadId)}
        />
      </div>

      {/* Advanced Recommendations */}
      {insights?.advancedRecommendations && (
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Advanced Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.advancedRecommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.type === 'ROI' 
                    ? 'border-green-600 bg-green-900/20' 
                    : rec.type === 'Duplicates'
                    ? 'border-yellow-600 bg-yellow-900/20'
                    : 'border-blue-600 bg-blue-900/20'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{rec.title}</h4>
                  {rec.roiEstimate && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      +{rec.roiEstimate}% ROI
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-300 mb-2">{rec.description}</p>
                <p className="text-xs text-gray-400 mb-3">{rec.impact}</p>
                {rec.action && (
                  <button className="text-xs bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-3 py-1 rounded transition-colors">
                    {rec.action}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Metadata */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Batch Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
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
              <span className="text-gray-400">ICP Match:</span>
              <span className="text-[#FF6B35] font-medium">{insights?.icpMatchPercentage || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Engagement:</span>
              <span className="text-white">{Math.round(batch.leads.reduce((sum, lead) => sum + (lead.engagementScore || 0), 0) / batch.leads.length)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Pipeline:</span>
              <span className="text-[#FF6B35] font-medium">${insights?.roiEstimate.estimatedValue || 0}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Delivery Method:</span>
              <span className="text-white">
                {batch.deliveryMethods.email ? 'Email + Dashboard' : 'Interactive Dashboard'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Export Available:</span>
              <span className="text-white">CSV with Advanced Metrics</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Insights Level:</span>
              <span className="text-purple-400 font-medium">Pro Advanced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}