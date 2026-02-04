'use client';

import { useState } from 'react';
import { FullInsights, LeadBatch } from '@/lib/inbox-types';

interface AdvancedDashboardProps {
  insights: FullInsights;
  batch: LeadBatch;
}

export function AdvancedDashboard({ insights, batch }: AdvancedDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('all');

  const metricCards = [
    {
      id: 'roi',
      title: 'ROI Analysis',
      value: `$${insights.roiEstimate.estimatedValue}`,
      change: `+${insights.roiEstimate.estimatedConversion}% est. conversion`,
      icon: '💰',
      color: 'green',
      description: 'Estimated pipeline value from these leads'
    },
    {
      id: 'duplicates',
      title: 'Duplicates',
      value: insights.duplicates.length.toString(),
      change: `${insights.duplicates.reduce((sum, group) => sum + group.leadIds.length - 1, 0)} leads affected`,
      icon: '🔍',
      color: 'yellow',
      description: 'Duplicate groups detected'
    },
    {
      id: 'enrichment',
      title: 'Enrichment',
      value: insights.enrichmentOpportunities.length.toString(),
      change: 'Lift potential +25% conversion',
      icon: '✨',
      color: 'blue',
      description: 'Leads missing key data points'
    },
    {
      id: 'competition',
      title: 'Competitive Intel',
      value: insights.competitiveInsights.length.toString(),
      change: `${insights.competitiveInsights.filter(c => c.relevance > 70).length} high-value`,
      icon: '🎯',
      color: 'purple',
      description: 'Competitor companies identified'
    },
  ];

  const filteredCards = selectedMetric === 'all' 
    ? metricCards 
    : metricCards.filter(card => card.id === selectedMetric);

  const handleCardClick = (metric: string) => {
    setSelectedMetric(selectedMetric === metric ? 'all' : metric);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Advanced Analytics Dashboard</h3>
          <p className="text-sm text-gray-400">Interactive dashboard with drill-down capabilities</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMetric('all')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedMetric === 'all'
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            View All
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedMetric === card.id
                ? `border-${card.color}-600 bg-${card.color}-900/30`
                : 'border-gray-600 bg-[#2a2a2a] hover:border-gray-500'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">{card.icon}</div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
            <div className="text-sm text-gray-400 mb-2">{card.title}</div>
            <div className={`text-xs ${
              card.color === 'green' ? 'text-green-400' :
              card.color === 'yellow' ? 'text-yellow-400' :
              card.color === 'blue' ? 'text-blue-400' :
              'text-purple-400'
            }`}>
              {card.change}
            </div>
            {card.description && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-500">{card.description}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Analysis Section */}
      {selectedMetric !== 'all' && (
        <div className="border-t border-gray-700 pt-6">
          <h4 className="text-lg font-semibold text-white mb-4">
            {metricCards.find(card => card.id === selectedMetric)?.title} Details
          </h4>
          
          {selectedMetric === 'roi' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded border border-gray-600">
                <div className="text-sm text-gray-400 mb-1">High Quality Leads</div>
                <div className="text-xl font-bold text-white">{insights.qualityTierFunnel.find(t => t.tier === 'High Quality')?.count || 0}</div>
                <div className="text-xs text-green-400">Best conversion potential</div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded border border-gray-600">
                <div className="text-sm text-gray-400 mb-1">Avg Engagement</div>
                <div className="text-xl font-bold text-white">
                  {Math.round(batch.leads.reduce((sum, lead) => sum + (lead.engagementScore || 0), 0) / batch.leads.length)}%
                </div>
                <div className="text-xs text-blue-400">Response likelihood</div>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded border border-gray-600">
                <div className="text-sm text-gray-400 mb-1">Est. Conversions</div>
                <div className="text-xl font-bold text-white">
                  {Math.round((insights.roiEstimate.estimatedConversion / 100) * batch.totalLeads)}
                </div>
                <div className="text-xs text-purple-400">Based on quality scores</div>
              </div>
            </div>
          )}
          
          {selectedMetric === 'duplicates' && insights.duplicates.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {insights.duplicates.slice(0, 5).map((group, index) => (
                <div key={group.groupId} className="bg-[#2a2a2a] p-3 rounded border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-white">Duplicate Group #{index + 1}</div>
                    <div className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">{group.leadIds.length} leads</div>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">Matching on: {group.commonFields.join(', ')}</div>
                  <div className="text-xs text-gray-500">Match quality: {group.potentialMatchQuality}%</div>
                </div>
              ))}
              {insights.duplicates.length > 5 && (
                <div className="text-center text-sm text-gray-400">
                  +{insights.duplicates.length - 5} more duplicate groups
                </div>
              )}
            </div>
          )}
          
          {selectedMetric === 'enrichment' && insights.enrichmentOpportunities.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {insights.enrichmentOpportunities.slice(0, 5).map((opportunity, index) => {
                const lead = batch.leads.find(l => l.id === opportunity.leadId);
                return (
                  <div key={opportunity.leadId} className="bg-[#2a2a2a] p-3 rounded border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium text-white">{lead?.name || 'Unknown'}</div>
                      <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded">+{opportunity.enrichmentValue}% value</div>
                    </div>
                    <div className="text-xs text-gray-400 mb-1">Missing: {opportunity.missingFields.join(', ')}</div>
                    <div className="text-xs text-gray-500">Impact: {opportunity.potentialImpact}</div>
                  </div>
                );
              })}
              {insights.enrichmentOpportunities.length > 5 && (
                <div className="text-center text-sm text-gray-400">
                  +{insights.enrichmentOpportunities.length - 5} more opportunities
                </div>
              )}
            </div>
          )}
          
          {selectedMetric === 'competition' && insights.competitiveInsights.length > 0 && (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {insights.competitiveInsights.map((insight, index) => (
                <div key={index} className="bg-[#2a2a2a] p-3 rounded border border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-white">{insight.companyName}</div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      insight.relevance >= 80 ? 'bg-red-600 text-white' :
                      insight.relevance >= 60 ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {insight.relevance}% relevant
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {insight.employeeCount} employees • {insight.revenue || 'Revenue unknown'}
                  </div>
                  {insight.relevance >= 60 && (
                    <div className="text-xs text-purple-400">⚠️ Consider competitive positioning</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Items */}
      <div className="mt-6 p-4 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#FF6B35]">⚡</span>
          <h5 className="font-semibold text-white">Recommended Actions</h5>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="text-gray-300">• Export high-quality leads first</div>
          <div className="text-gray-300">• Enrich data for better targeting</div>
          <div className="text-gray-300">• Review and merge duplicates</div>
          <div className="text-gray-300">• Focus on top-performing segment</div>
        </div>
      </div>
    </div>
  );
}