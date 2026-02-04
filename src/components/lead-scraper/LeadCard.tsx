"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  Copy,
  Check,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Users,
} from "lucide-react";
import { useCraftMessages } from "@/lib/contexts/CraftMessagesContext";
import type { LeadSearchResult } from "@/lib/lead-types";

interface LeadCardProps {
  lead: LeadSearchResult;
}

const categoryColors: Record<string, string> = {
  Tech: "bg-blue-900/40 text-blue-300 border-blue-800/60",
  Healthcare: "bg-green-900/40 text-green-300 border-green-800/60",
  Finance: "bg-purple-900/40 text-purple-300 border-purple-800/60",
};

const LeadCard = ({ lead }: LeadCardProps) => {
  const { openCraftMessages } = useCraftMessages();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopy = async (value: string, type: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(value);
      if (type === "email") {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  const socials = Array.isArray(lead.socialMedia) ? lead.socialMedia : [];
  const categoryBadgeStyle = categoryColors[lead.category] || "bg-gray-800/50 text-gray-300 border-gray-700";

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-5 space-y-4 hover:border-[#FF6B35] hover:shadow-lg hover:shadow-[#FF6B35]/10 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{lead.name}</h3>
          <div className="text-sm text-gray-400 flex items-center gap-2 mt-1.5">
            <Building2 size={14} className="text-[#FF6B35]" />
            <span>{lead.company || lead.website || "Unknown company"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs border rounded-full px-3 py-1 ${categoryBadgeStyle}`}>{lead.category}</span>
          <span className="text-xs border border-gray-700/60 rounded-full px-3 py-1 text-gray-300 bg-gray-800/30">{lead.country}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Email - prominent */}
        <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 border border-[#FF6B35]/30 rounded-lg p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#FF6B35]" />
              <span className="text-[#FF6B35] font-medium text-sm break-all">{lead.email}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(lead.email, "email")}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                copiedEmail 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30 hover:bg-[#FF6B35]/30'
              }`}
            >
              {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {lead.phone && (
          <div className="flex items-center justify-between gap-2 bg-gray-900/30 rounded-lg p-3 border border-gray-800/50">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              <span className="break-all text-white text-sm">{lead.phone}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(lead.phone || "", "phone")}
              className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200 ${
                copiedPhone 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {copiedPhone ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}

        <div className="grid gap-2 text-sm">
          {lead.website && (
            <div className="flex items-center gap-2.5 text-gray-400">
              <Globe size={14} className="text-gray-500" />
              <a
                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#FF6B35] transition-colors break-all"
              >
                {lead.website}
              </a>
            </div>
          )}

          {lead.openHours && (
            <div className="flex items-center gap-2.5 text-gray-400">
              <Clock size={14} className="text-gray-500" />
              <span>{lead.openHours}</span>
            </div>
          )}

          {lead.companySize && lead.companySize !== 'Unknown' && (
            <div className="flex items-center gap-2.5 text-gray-400">
              <Users size={14} className="text-gray-500" />
              <span>{lead.companySize} employees</span>
            </div>
          )}

          {lead.industrySubcategory && (
            <div className="flex items-center gap-2.5 text-gray-400">
              <MapPin size={14} className="text-gray-500" />
              <span>{lead.industrySubcategory}</span>
            </div>
          )}
        </div>
      </div>

      {socials.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {socials.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 hover:text-[#FF6B35] transition-colors underline underline-offset-4"
            >
              {link.replace(/^https?:\/\//, "")}
            </a>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-800/60">
        <button
          type="button"
          onClick={() => openCraftMessages({
            id: lead.id,
            firstName: lead.name.split(" ")[0] || lead.name,
            lastName: lead.name.split(" ").slice(1).join(" "),
            email: lead.email,
            company: lead.company || lead.website || "Unknown",
            title: lead.title || "",
            location: lead.location || lead.country,
            companySize: lead.companySize || "",
            industry: lead.category,
            website: lead.website,
            phone: lead.phone,
            openHours: lead.openHours,
            socialMedia: socials.join(", "),
          })}
          className="inline-flex items-center gap-2 rounded-lg border border-[#FF6B35]/50 bg-gradient-to-r from-[#FF6B35]/20 to-[#FF8B55]/20 px-4 py-2.5 text-[#FF6B35] hover:from-[#FF6B35]/30 hover:to-[#FF8B55]/30 transition-all duration-300 shadow-md shadow-[#FF6B35]/10 font-medium"
        >
          <MessageSquare size={16} />
          Craft Message
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
