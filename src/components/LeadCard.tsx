"use client";

import React from "react";
import { Copy, Check, Trash2, Building2, MapPin, Users, Briefcase, MessageSquare, Clock, Globe } from "lucide-react";
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
    // Open the Craft Messages modal with this lead
    openCraftMessages(lead);
  };

  const getCategoryBadge = (category: string) => {
    const lowerCat = category.toLowerCase();
    let color = "bg-gray-800 text-gray-400 border-gray-700";
    
    if (lowerCat.includes("tech") || lowerCat.includes("saas")) {
      color = "bg-blue-900/30 text-blue-400 border-blue-900/50";
    } else if (lowerCat.includes("health")) {
      color = "bg-green-900/30 text-green-400 border-green-900/50";
    } else if (lowerCat.includes("finance")) {
      color = "bg-purple-900/30 text-purple-400 border-purple-900/50";
    }
  
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${color}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 space-y-4 hover:border-[#FF6B35]/50 transition-all">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-3">
        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 flex-shrink-0">
           <span className="text-gray-500 text-sm">{(lead.firstName?.[0] || "") + (lead.lastName?.[0] || "")}</span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-white font-medium text-sm truncate">{lead.firstName} {lead.lastName}</span>
          <span className="text-gray-500 text-xs truncate">{lead.title}</span>
        </div>
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
              {lead.company}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
                 {getCategoryBadge(lead.industry)}
                 <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-gray-700 text-gray-300">
                    {lead.location}
                 </span>
            </div>
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
            <Users size={14} className="flex-shrink-0" />
            <span className="truncate">{lead.companySize} employees</span>
          </div>
          
          {lead.openHours && (
            <div className="flex items-center gap-2 text-gray-400">
                <Clock size={14} className="flex-shrink-0" />
                <span className="truncate">{lead.openHours}</span>
            </div>
          )}

          {lead.socialMedia && (
            <div className="flex items-center gap-2 text-gray-400">
                <Globe size={14} className="flex-shrink-0" />
                <span className="truncate">{lead.socialMedia}</span>
            </div>
          )}
        </div>
      </div>

      {/* Craft Message Button */}
      <div className="pt-3 border-t border-gray-800">
        <button
          onClick={handleCraftMessage}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50"
        >
          <MessageSquare size={16} />
          Craft Message
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
