"use client";

import React from "react";
import { Copy, Check, Trash2, Building2, MapPin, Users, Briefcase, ExternalLink } from "lucide-react";
import type { Lead } from "./LeadScraper";

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyEmail: (email: string) => void;
  copiedEmail: string | null;
}

const LeadCard = ({ lead, isSelected, onSelect, onDelete, onCopyEmail, copiedEmail }: LeadCardProps) => {
  const getSourceBadge = (source: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      reddit: { color: "bg-orange-900/30 text-orange-400 border-orange-900/50", label: "Reddit" },
      twitter: { color: "bg-blue-900/30 text-blue-400 border-blue-900/50", label: "Twitter" },
      youtube: { color: "bg-red-900/30 text-red-400 border-red-900/50", label: "YouTube" },
      google: { color: "bg-green-900/30 text-green-400 border-green-900/50", label: "Google" },
      instagram: { color: "bg-pink-900/30 text-pink-400 border-pink-900/50", label: "Instagram" },
      facebook: { color: "bg-indigo-900/30 text-indigo-400 border-indigo-900/50", label: "Facebook" },
      discord: { color: "bg-purple-900/30 text-purple-400 border-purple-900/50", label: "Discord" }
    };

    const badge = badges[source] || { color: "bg-gray-800 text-gray-400", label: "Unknown" };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 space-y-4 hover:border-[#FF6B35]/50 transition-all">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
        {lead.founderImage ? (
          <img 
            src={lead.founderImage} 
            alt={lead.founderName} 
            className="w-12 h-12 rounded-full border border-gray-700 object-cover flex-shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 flex-shrink-0">
            <span className="text-gray-500">?</span>
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-medium text-sm truncate">{lead.founderName}</span>
          <span className="text-gray-500 text-xs truncate">{lead.founderTitle}</span>
        </div>
        {lead.source && getSourceBadge(lead.source)}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(lead.id)}
            className="w-5 h-5 mt-1 accent-[#FF6B35] cursor-pointer flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">
              {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-gray-400 text-sm truncate">{lead.title}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(lead.id)}
          className="text-gray-500 hover:text-red-500 transition-colors p-2 flex-shrink-0"
          title="Remove lead"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[#FF6B35] font-medium break-all">{lead.email}</span>
          <button
            onClick={() => onCopyEmail(lead.email)}
            className="text-gray-500 hover:text-[#FF6B35] transition-colors flex-shrink-0 p-1"
            title="Copy email"
          >
            {copiedEmail === lead.email ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Building2 size={14} className="flex-shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate">{lead.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <Users size={14} className="flex-shrink-0" />
            <span className="truncate">{lead.companySize} employees</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-400">
            <Briefcase size={14} className="flex-shrink-0" />
            <span className="truncate">{lead.industry}</span>
          </div>
          
          {lead.matchQualityScore !== undefined && (
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Match Quality:</span>
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                  lead.matchQualityScore >= 80 ? 'bg-green-900/30 text-green-400' :
                  lead.matchQualityScore >= 60 ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {lead.matchQualityScore}%
                </div>
              </div>
            </div>
          )}
          
          {lead.matchedCriteria && lead.matchedCriteria.length > 0 && (
            <div className="pt-2 border-t border-gray-800">
              <div className="text-[10px] text-gray-500 mb-1">Matched Criteria:</div>
              <div className="flex flex-wrap gap-1">
                {lead.matchedCriteria.map((criterion, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-900/20 text-blue-400 text-[10px] rounded border border-blue-900/30">
                    {criterion}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {(lead.fundingStage || lead.annualRevenue) && (
            <div className="pt-2 border-t border-gray-800">
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {lead.fundingStage && (
                  <div>
                    <span className="text-gray-500">Funding:</span>
                    <div className="text-gray-400">{lead.fundingStage}</div>
                  </div>
                )}
                {lead.annualRevenue && (
                  <div>
                    <span className="text-gray-500">Revenue:</span>
                    <div className="text-gray-400">{lead.annualRevenue}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Source URL link */}
          {lead.sourceUrl && (
            <div className="pt-2 border-t border-gray-800">
              <a
                href={lead.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#FF6B35] transition-colors"
              >
                <ExternalLink size={12} />
                View source
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
