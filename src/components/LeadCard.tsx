"use client";

import React from "react";
import { Copy, Check, Trash2, Clock, Globe, Building2, Mail } from "lucide-react";
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
    <div className="bg-gradient-to-br from-black via-gray-900/20 to-black border border-gray-800/60 rounded-xl p-5 space-y-4 hover:border-[#FF6B35]/80 hover:shadow-2xl hover:shadow-[#FF6B35]/20 transition-all duration-500 group hover:scale-[1.02] hover:-translate-y-1">
      {/* Header section */}
      <div className="flex items-center gap-4 border-b border-gray-800/60 pb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 via-[#FF6B35]/10 to-gray-800 flex items-center justify-center border border-[#FF6B35]/30 flex-shrink-0 shadow-lg shadow-[#FF6B35]/20 group-hover:shadow-[#FF6B35]/40 group-hover:border-[#FF6B35]/60 transition-all duration-500">
           <span className="text-[#FF6B35] font-bold text-lg drop-shadow-sm">{(lead.firstName?.[0] || "") + (lead.lastName?.[0] || "")}</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-bold text-lg truncate tracking-tight group-hover:text-[#FF6B35] transition-colors duration-300">{lead.firstName} {lead.lastName}</span>
          <span className="text-gray-400 text-sm truncate mt-0.5 font-medium">{lead.title}</span>
        </div>
      </div>

      {/* Company section */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(lead.id)}
            className="w-5 h-5 mt-0.5 accent-[#FF6B35] cursor-pointer flex-shrink-0 rounded border-gray-600 focus:ring-2 focus:ring-[#FF6B35]/50 focus:ring-offset-0 focus:ring-offset-transparent"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#FF6B35] flex-shrink-0 drop-shadow-sm" />
              <h3 className="text-white font-bold text-xl truncate group-hover:text-[#FF6B35] transition-colors duration-300">
                {lead.company}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
                 {getCategoryBadge(lead.industry)}
                 <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border border-[#FF6B35]/30 text-[#FF6B35] bg-[#FF6B35]/10 backdrop-blur-sm">
                    {lead.location}
                 </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => onDelete(lead.id)}
          className="text-gray-500 hover:text-red-400 transition-all p-2.5 flex-shrink-0 rounded-lg hover:bg-red-950/30 hover:scale-110"
          title="Remove lead"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Email section - prominent */}
      <div className="bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/15 to-[#FF6B35]/10 border-2 border-[#FF6B35]/40 rounded-lg p-4 shadow-lg shadow-[#FF6B35]/10 group-hover:shadow-[#FF6B35]/25 group-hover:shadow-xl transition-all duration-500">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center border border-[#FF6B35]/40">
              <Mail size={16} className="text-[#FF6B35]" />
            </div>
            <span className="text-[#FF6B35] font-bold text-lg break-all">{lead.email}</span>
          </div>
          <button
            onClick={() => onCopyEmail(lead.email)}
            className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
              copiedEmail === lead.email 
                ? 'bg-green-500/30 text-green-400 border-2 border-green-500/50 shadow-lg' 
                : 'bg-[#FF6B35]/30 text-[#FF6B35] border-2 border-[#FF6B35]/50 hover:bg-[#FF6B35]/40 hover:scale-110 hover:shadow-lg hover:shadow-[#FF6B35]/30'
            }`}
            title="Copy email"
          >
            {copiedEmail === lead.email ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      {/* Details section */}
      <div className="space-y-3">
        {lead.openHours && (
          <div className="flex items-center gap-3 text-gray-400 text-sm bg-gray-800/20 border border-gray-700/40 rounded-lg p-3 group-hover:border-[#FF6B35]/30 group-hover:bg-[#FF6B35]/5 transition-all duration-300">
            <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 group-hover:border-[#FF6B35]/30 transition-all duration-300">
              <Clock size={14} className="text-gray-400 group-hover:text-[#FF6B35] transition-colors duration-300" />
            </div>
            <span className="truncate font-medium">{lead.openHours}</span>
          </div>
        )}

        {lead.socialMedia && (
          <div className="flex items-center gap-3 text-gray-400 text-sm bg-gray-800/20 border border-gray-700/40 rounded-lg p-3 group-hover:border-[#FF6B35]/30 group-hover:bg-[#FF6B35]/5 transition-all duration-300">
            <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 group-hover:border-[#FF6B35]/30 transition-all duration-300">
              <Globe size={14} className="text-gray-400 group-hover:text-[#FF6B35] transition-colors duration-300" />
            </div>
            <span className="truncate font-medium">{lead.socialMedia}</span>
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
