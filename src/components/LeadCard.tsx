"use client";

import React from "react";
import { Copy, Check, Trash2, Building2, MapPin, Users, Briefcase } from "lucide-react";
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
  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 space-y-3 hover:border-[#FF6B35]/50 transition-all">
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
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
