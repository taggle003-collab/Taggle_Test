"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Clock,
  Copy,
  Check,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Music2,
  Phone,
  Pin,
  Twitter,
  Users,
  Youtube,
  type LucideIcon,
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

type SocialPlatform =
  | "instagram"
  | "youtube"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "pinterest"
  | "facebook"
  | "other";

type SocialLink = {
  platform: SocialPlatform;
  label: string;
  url: string;
  displayUrl: string;
  Icon: LucideIcon;
};

const platformMeta: Record<Exclude<SocialPlatform, "other">, { label: string; Icon: LucideIcon; baseUrl: string }> =
  {
    instagram: { label: "Instagram", Icon: Instagram, baseUrl: "https://instagram.com/" },
    youtube: { label: "YouTube", Icon: Youtube, baseUrl: "https://youtube.com/" },
    linkedin: { label: "LinkedIn", Icon: Linkedin, baseUrl: "https://linkedin.com/" },
    twitter: { label: "X", Icon: Twitter, baseUrl: "https://x.com/" },
    tiktok: { label: "TikTok", Icon: Music2, baseUrl: "https://www.tiktok.com/" },
    pinterest: { label: "Pinterest", Icon: Pin, baseUrl: "https://pinterest.com/" },
    facebook: { label: "Facebook", Icon: Facebook, baseUrl: "https://facebook.com/" },
  };

const inferPlatform = (raw: string): SocialPlatform => {
  const value = raw.toLowerCase();

  if (value.includes("instagram") || value.includes("instagr.am")) return "instagram";
  if (value.includes("youtube") || value.includes("youtu.be")) return "youtube";
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("twitter") || value.includes("x.com")) return "twitter";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("pinterest")) return "pinterest";
  if (value.includes("facebook") || value.includes("fb.com")) return "facebook";

  return "other";
};

const normalizeUrl = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("www.")) return `https://${trimmed}`;
  if (trimmed.includes(".")) return `https://${trimmed}`;

  return trimmed;
};

const buildSocialUrl = (platform: SocialPlatform, raw: string): string => {
  const cleaned = raw.trim();
  if (!cleaned) return "";

  const normalized = normalizeUrl(cleaned);
  if (normalized.startsWith("http")) return normalized;

  if (platform === "other") return "";

  const handle = normalized.replace(/^@/, "");
  const base = platformMeta[platform].baseUrl;

  if (platform === "tiktok") {
    return `${base}@${handle}`;
  }

  if (platform === "youtube") {
    return cleaned.startsWith("@") ? `${base}${cleaned}` : `${base}@${handle}`;
  }

  return `${base}${handle}`;
};

const parseEmails = (emailsValue: string): string[] =>
  emailsValue
    .split(/[,\n;]/)
    .map((e) => e.trim())
    .filter(Boolean);

const parseSocialLinks = (socialValue?: string | string[]): SocialLink[] => {
  if (!socialValue) return [];

  const rawParts = Array.isArray(socialValue)
    ? socialValue
    : socialValue
        .split(/[,\n;]/)
        .map((v) => v.trim())
        .filter(Boolean);

  const links = rawParts
    .map((raw): SocialLink | null => {
      const platform = inferPlatform(raw);

      if (platform === "other") {
        const url = normalizeUrl(raw);
        if (!url) return null;

        return {
          platform,
          label: "Link",
          url,
          displayUrl: url.replace(/^https?:\/\//, "").replace(/^www\./, ""),
          Icon: Globe,
        };
      }

      const url = buildSocialUrl(platform, raw);
      if (!url) return null;

      const { label, Icon } = platformMeta[platform];

      return {
        platform,
        label,
        url,
        displayUrl: url.replace(/^https?:\/\//, "").replace(/^www\./, ""),
        Icon,
      };
    })
    .filter((v): v is SocialLink => Boolean(v));

  const uniqueByUrl = new Map<string, SocialLink>();
  for (const link of links) {
    uniqueByUrl.set(link.url, link);
  }

  return Array.from(uniqueByUrl.values());
};

const LeadCard = ({ lead }: LeadCardProps) => {
  const { openCraftMessages } = useCraftMessages();
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } catch (error) {
      console.error("Failed to copy", error);
    }
  };

  const emails = parseEmails(lead.email || "");
  const socialLinks = parseSocialLinks(lead.socialMedia);
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
          <div className="space-y-2">
            {emails.length > 0 ? (
              emails.map((email) => {
                const isCopied = copiedEmail === email;

                return (
                  <div key={email} className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(email)}
                      className="flex items-center gap-2 min-w-0 text-left group/email"
                      title={`Copy ${email}`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center border border-[#FF6B35]/40 flex-shrink-0">
                        <Mail size={14} className="text-gray-200 group-hover/email:text-[#FF6B35] transition-colors duration-200" />
                      </div>
                      <span className="text-[#FF6B35] font-medium text-sm break-all group-hover/email:text-white transition-colors duration-200">
                        {email}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyEmail(email)}
                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg transition-all duration-200 inline-flex items-center gap-1.5 border ${
                        isCopied
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30 hover:bg-[#FF6B35]/30 hover:scale-105"
                      }`}
                      title="Copy email"
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} />
                          <span className="text-xs font-semibold hidden sm:inline">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span className="text-xs font-semibold hidden sm:inline">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-7 h-7 rounded-lg bg-gray-800/50 flex items-center justify-center border border-gray-700/60">
                  <Mail size={14} className="text-gray-500" />
                </div>
                <span className="text-sm font-medium">No email</span>
              </div>
            )}
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
              onClick={() => handleCopyPhone(lead.phone || "")}
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

      {socialLinks.length > 0 && (
        <div className="bg-gray-900/30 border border-gray-800/50 rounded-lg p-3">
          <div className="space-y-2">
            {socialLinks.map(({ label, url, displayUrl, Icon }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                title={label}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-gray-800/40 transition-colors group/social"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={16}
                    className="text-gray-400 group-hover/social:text-[#FF6B35] transition-colors duration-200 flex-shrink-0"
                  />
                  <span className="flex flex-col min-w-0">
                    <span className="text-gray-300 font-semibold text-sm group-hover/social:text-white transition-colors duration-200">
                      {label}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {displayUrl}
                    </span>
                  </span>
                </span>

                <ArrowUpRight
                  size={16}
                  className="text-gray-500 group-hover/social:text-[#FF6B35] transition-colors duration-200 flex-shrink-0"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-gray-800/60">
        <button
          type="button"
          onClick={() => openCraftMessages({
            id: lead.id,
            firstName: lead.name.split(" ")[0] || lead.name,
            lastName: lead.name.split(" ").slice(1).join(" "),
            email: emails[0] || "",
            company: lead.company || lead.website || "Unknown",
            title: lead.title || "",
            location: lead.location || lead.country,
            companySize: lead.companySize || "",
            industry: lead.category,
            website: lead.website,
            phone: lead.phone,
            openHours: lead.openHours,
            socialMedia: socialLinks.map(link => link.url).join(", "),
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
