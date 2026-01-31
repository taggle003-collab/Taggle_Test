"use client";

import React from "react";
import { Copy, Check, Trash2, Users, Clock, Globe, Building2 } from "lucide-react";
import type { Lead } from "@/lib/lead-types";
import { useCraftMessages } from "@/lib/contexts/CraftMessagesContext";

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyEmail: (email: string) => void;
  copiedEmail: string | null;
}

const LeadCard = ({ lead, isSelected, onSelect, onDelete, onCopyEmail, copiedEmail }: LeadCardProps) => {
  const { openCraftMessages } = useCraftMessages();

  const handleCraftMessage = () => {
    openCraftMessages(lead);
  };

  const getCategoryBadge = (category: string) => {
    const lowerCat = category.toLowerCase();
    let color = "bg-gray-800/50 text-gray-300 border-gray-700";
    
    if (lowerCat.includes("tech") || lowerCat.includes("saas")) {
      color = "bg-blue-900/40 text-blue-300 border-blue-800/60";
    } else if (lowerCat.includes("health")) {
      color = "bg-green-900/40 text-green-300 border-green-800/60";
    } else if (lowerCat.includes("finance")) {
      color = "bg-purple-900/40 text-purple-300 border-purple-800/60";
    }
  
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-5 space-y-4 hover:border-[#FF6B35] hover:shadow-lg hover:shadow-[#FF6B35]/10 transition-all duration-300">
      {/* Header section */}
      <div className="flex items-center gap-4 border-b border-gray-800/60 pb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700/50 flex-shrink-0 shadow-inner">
           <span className="text-gray-400 font-semibold text-base">{(lead.firstName?.[0] || "") + (lead.lastName?.[0] || "")}</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-semibold text-base truncate tracking-tight">{lead.firstName} {lead.lastName}</span>
          <span className="text-gray-400 text-sm truncate mt-0.5">{lead.title}</span>
        </div>
      </div>

      {/* Company section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(lead.id)}
            className="w-5 h-5 mt-0.5 accent-[#FF6B35] cursor-pointer flex-shrink-0 rounded border-gray-600"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#FF6B35] flex-shrink-0" />
              <h3 className="text-white font-bold text-lg truncate">
                {lead.company}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5">
                 {getCategoryBadge(lead.industry)}
                 <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-gray-700/60 text-gray-300 bg-gray-800/30">
                    {lead.location}
                 </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(lead.id)}
          className="text-gray-500 hover:text-red-400 transition-colors p-2 flex-shrink-0 rounded-lg hover:bg-red-950/30"
          title="Remove lead"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Email section - prominent */}
      <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 border border-[#FF6B35]/30 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#FF6B35] font-semibold text-base break-all">{lead.email}</span>
          <button
            onClick={() => onCopyEmail(lead.email)}
            className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
              copiedEmail === lead.email 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30 hover:bg-[#FF6B35]/30'
            }`}
            title="Copy email"
          >
            {copiedEmail === lead.email ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Details section */}
      <div className="space-y-2.5">
        {lead.companySize && lead.companySize !== 'Unknown' && (
          <div className="flex items-center gap-2.5 text-gray-400 text-sm">
            <div className="w-7 h-7 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
              <Users size={13} className="text-gray-400" />
            </div>
            <span className="truncate">{lead.companySize} employees</span>
          </div>
        )}
        
        {lead.openHours && (
          <div className="flex items-center gap-2.5 text-gray-400 text-sm">
            <div className="w-7 h-7 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
              <Clock size={13} className="text-gray-400" />
            </div>
            <span className="truncate">{lead.openHours}</span>
          </div>
        )}

        {lead.socialMedia && (
          <div className="flex items-center gap-2.5 text-gray-400 text-sm">
            <div className="w-7 h-7 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50">
              <Globe size={13} className="text-gray-400" />
            </div>
            <span className="truncate">{lead.socialMedia}</span>
          </div>
        )}
      </div>

      {/* Craft Message Button */}
      <div className="pt-4 border-t border-gray-800/60">
        <button
          onClick={handleCraftMessage}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] hover:from-[#FF8B55] hover:to-[#FF6B35] text-white rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-[#FF6B35]/25 hover:shadow-[#FF6B35]/40"
        >
          Craft Message
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
