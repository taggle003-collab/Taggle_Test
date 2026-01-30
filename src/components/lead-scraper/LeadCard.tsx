"use client";

import React, { useState } from "react";
import {
  Building2,
  Clock,
  Copy,
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
  Tech: "bg-blue-600/20 text-blue-300 border-blue-600/40",
  Healthcare: "bg-green-600/20 text-green-300 border-green-600/40",
  Finance: "bg-purple-600/20 text-purple-300 border-purple-600/40",
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
  const categoryBadgeStyle = categoryColors[lead.category] || "bg-gray-700 text-gray-200 border-gray-600";

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
          <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
            <Building2 size={14} />
            <span>{lead.company || lead.website || "Unknown company"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs border rounded-full px-3 py-1 ${categoryBadgeStyle}`}>{lead.category}</span>
          <span className="text-xs border border-gray-700 rounded-full px-3 py-1 text-gray-200">{lead.country}</span>
        </div>
      </div>

      <div className="grid gap-3 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400" />
          <span className="break-all text-white">{lead.email}</span>
          <button
            type="button"
            onClick={() => handleCopy(lead.email, "email")}
            className="text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-300 hover:text-white"
          >
            {copiedEmail ? "Copied" : "Copy"}
          </button>
        </div>

        {lead.phone && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <span className="break-all text-white">{lead.phone}</span>
            <button
              type="button"
              onClick={() => handleCopy(lead.phone || "", "phone")}
              className="text-xs px-2 py-1 rounded-md border border-gray-700 text-gray-300 hover:text-white"
            >
              {copiedPhone ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {lead.website && (
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-gray-400" />
            <a
              href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 break-all"
            >
              {lead.website}
            </a>
          </div>
        )}

        {lead.openHours && (
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <span>{lead.openHours}</span>
          </div>
        )}

        {lead.companySize && (
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            <span>{lead.companySize} employees</span>
          </div>
        )}

        {lead.industrySubcategory && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span>{lead.industrySubcategory}</span>
          </div>
        )}
      </div>

      {socials.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          {socials.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 hover:text-white underline underline-offset-4"
            >
              {link.replace(/^https?:\/\//, "")}
            </a>
          ))}
        </div>
      )}

      <div className="flex justify-end">
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
          className="inline-flex items-center gap-2 rounded-lg border border-blue-600/50 bg-blue-600/20 px-4 py-2 text-blue-200 hover:bg-blue-600/40 transition-colors"
        >
          <MessageSquare size={16} />
          Craft Message
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
