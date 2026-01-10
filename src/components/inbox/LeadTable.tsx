'use client';

import { useState } from 'react';
import { ScrapedLead } from '@/lib/inbox-types';
import { QUALITY_COLORS } from '@/lib/inbox-utils';

interface LeadTableProps {
  leads: ScrapedLead[];
  showQualityScore?: boolean;
  showEngagementScore?: boolean;
  onLeadClick?: (leadId: string) => void;
}

export function LeadTable({ 
  leads, 
  showQualityScore = false, 
  showEngagementScore = false,
  onLeadClick
}: LeadTableProps) {
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: any = a[sortField as keyof ScrapedLead];
    let bVal: any = b[sortField as keyof ScrapedLead];
    
    // Special handling for nested fields
    if (sortField === 'matchQualityScore') {
      aVal = a.matchQualityScore || 0;
      bVal = b.matchQualityScore || 0;
    } else if (sortField === 'engagementScore') {
      aVal = a.engagementScore || 0;
      bVal = b.engagementScore || 0;
    }
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getQualityBadgeColor = (score: number) => {
    if (score >= 80) return QUALITY_COLORS.HIGH;
    if (score >= 60) return QUALITY_COLORS.MEDIUM;
    return QUALITY_COLORS.LOW;
  };

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th 
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-[#FF6B35]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2a2a2a]">
          <tr>
            <SortHeader field="name" label="Name" />
            <SortHeader field="company" label="Company" />
            <SortHeader field="title" label="Title" />
            <SortHeader field="location" label="Location" />
            <SortHeader field="industry" label="Industry" />
            {showQualityScore && (
              <SortHeader field="matchQualityScore" label="Quality Score" />
            )}
            {showEngagementScore && (
              <SortHeader field="engagementScore" label="Engagement" />
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                Verified
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1a1a1a] divide-y divide-gray-700">
          {sortedLeads.length === 0 ? (
            <tr>
              <td colSpan={showQualityScore && showEngagementScore ? 9 : showQualityScore ? 8 : 7} 
                  className="px-6 py-8 text-center text-gray-400">
                No leads found matching your filters
              </td>
            </tr>
          ) : (
            sortedLeads.map((lead) => (
              <tr 
                key={lead.id}
                onClick={() => onLeadClick && onLeadClick(lead.id)}
                className={`hover:bg-[#2a2a2a] ${onLeadClick ? 'cursor-pointer' : ''} transition-colors`}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">{lead.name}</div>
                    <div className="text-xs text-gray-400">{lead.email}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">{lead.company}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">{lead.title}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">{lead.location}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded">{lead.industry || 'Unknown'}</span>
                </td>
                {showQualityScore && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    {lead.matchQualityScore !== undefined ? (
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: getQualityBadgeColor(lead.matchQualityScore),
                          color: '#ffffff'
                        }}
                      >
                        {lead.matchQualityScore}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                )}
                {showEngagementScore && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    {lead.engagementScore !== undefined ? (
                      <div>
                        <div className="text-sm font-medium text-white">{lead.engagementScore}%</div>
                        <div className="w-16 h-1 bg-gray-700 rounded mt-1">
                          <div 
                            className="h-full bg-[#FF6B35] rounded"
                            style={{ width: `${lead.engagementScore}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded ${
                    lead.verified 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    {lead.verified ? '✓' : '✗'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}