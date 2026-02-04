"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Building2,
  Check,
  Clock,
  Copy,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Music2,
  Pin,
  Trash2,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { Lead } from "@/lib/lead-types";
import { useCraftMessages } from "@/lib/contexts/CraftMessagesContext";

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCopyEmail: (email: string) => void;
  copiedEmail: string | null;
  icpMatch?: { score: number; matches: string[] };
}

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

// Extract clean domain from URL
const extractDomain = (url?: string): string | null => {
  if (!url) return null;
  
  try {
    const cleaned = url.trim().toLowerCase();
    const withProtocol = cleaned.startsWith('http://') || cleaned.startsWith('https://') 
      ? cleaned 
      : `https://${cleaned}`;
    
    const urlObj = new URL(withProtocol);
    let domain = urlObj.hostname;
    
    // Remove www. prefix
    domain = domain.replace(/^www\./, '');
    
    return domain;
  } catch {
    // If URL parsing fails, try basic extraction
    const cleaned = url.trim().toLowerCase();
    const withoutProtocol = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const domainPart = withoutProtocol.split('/')[0];
    return domainPart || null;
  }
};

// WebsiteLogo component - displays favicon using Google's favicon service
const WebsiteLogo = ({ website }: { website?: string }) => {
  const [hasError, setHasError] = useState(false);
  
  if (!website || hasError) {
    return (
      <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 flex-shrink-0">
        <Globe size={16} className="text-gray-400" />
      </div>
    );
  }
  
  const domain = extractDomain(website);
  if (!domain) {
    return (
      <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 flex-shrink-0">
        <Globe size={16} className="text-gray-400" />
      </div>
    );
  }
  
  // Using Google's favicon service with fallback
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  
  return (
    <div className="w-8 h-8 rounded-md bg-white/90 flex items-center justify-center border border-gray-700/50 flex-shrink-0 overflow-hidden">
      <img
        src={faviconUrl}
        alt={`${domain} logo`}
        className="w-6 h-6 object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
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

const parseSocialLinks = (socialValue?: string): SocialLink[] => {
  if (!socialValue) return [];

  const rawParts = socialValue
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

const calculateLeadScore = (lead: Lead): number => {
  let score = 0;
  
  // Has email: +30 points
  if (lead.email && lead.email.trim() !== '') {
    score += 30;
  }
  
  // Has phone: +20 points
  if (lead.phone && lead.phone.trim() !== '') {
    score += 20;
  }
  
  // Has website: +20 points
  if (lead.website && lead.website.trim() !== '') {
    score += 20;
  }
  
  // Has 3+ social media links: +20 points
  const socialLinks = parseSocialLinks(lead.socialMedia);
  if (socialLinks.length >= 3) {
    score += 20;
  }
  
  // Has complete company info: +10 points
  if (lead.company && lead.company.trim() !== '' && 
      lead.industry && lead.industry.trim() !== '' && 
      lead.location && lead.location.trim() !== '') {
    score += 10;
  }
  
  return Math.min(score, 100); // Cap at 100
};

const getScoreColor = (score: number): string => {
  if (score <= 30) return 'bg-red-500/20 text-red-400 border-red-500/40';
  if (score <= 70) return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
  return 'bg-green-500/20 text-green-400 border-green-500/40';
};

const LeadCard = ({
  lead,
  isSelected,
  onSelect,
  onDelete,
  onCopyEmail,
  copiedEmail,
  icpMatch,
}: LeadCardProps) => {
  const { openCraftMessages } = useCraftMessages();

  const handleCraftMessage = () => {
    openCraftMessages(lead);
  };

  const emails = parseEmails(lead.email || "");
  const socialLinks = parseSocialLinks(lead.socialMedia);
  const leadScore = calculateLeadScore(lead);

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
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}
      >
        {category}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-black via-gray-900/20 to-black border border-gray-800/60 rounded-xl p-5 space-y-4 hover:border-[#FF6B35]/80 hover:shadow-2xl hover:shadow-[#FF6B35]/20 transition-all duration-500 group hover:scale-[1.02] hover:-translate-y-1">
      <div className="flex items-center gap-4 border-b border-gray-800/60 pb-4 relative">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 via-[#FF6B35]/10 to-gray-800 flex items-center justify-center border border-[#FF6B35]/30 flex-shrink-0 shadow-lg shadow-[#FF6B35]/20 group-hover:shadow-[#FF6B35]/40 group-hover:border-[#FF6B35]/60 transition-all duration-500">
          <span className="text-[#FF6B35] font-bold text-lg drop-shadow-sm">
            {(lead.firstName?.[0] || "") + (lead.lastName?.[0] || "")}
          </span>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg truncate tracking-tight group-hover:text-[#FF6B35] transition-colors duration-300">
              {lead.firstName} {lead.lastName}
            </span>
            {icpMatch && icpMatch.score > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-900/40 border border-green-800/60 rounded-full">
                <Check size={12} className="text-green-400" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">
                  ICP Match
                </span>
              </div>
            )}
          </div>
          <span className="text-gray-400 text-sm truncate mt-0.5 font-medium">
            {lead.title}
          </span>
        </div>
        
        {/* Lead Score Badge */}
        <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold flex-shrink-0 ${getScoreColor(leadScore)}`}>
          Score: {leadScore}/100
        </div>
      </div>

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
              <WebsiteLogo website={lead.website} />
              <h3 className="text-white font-bold text-xl truncate group-hover:text-[#FF6B35] transition-colors duration-300">
                {lead.company}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {getCategoryBadge(lead.industry)}
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border border-[#FF6B35]/30 text-[#FF6B35] bg-[#FF6B35]/10 backdrop-blur-sm">
                {lead.location}
              </span>
              {icpMatch &&
                icpMatch.matches.length > 0 &&
                icpMatch.matches.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border bg-green-900/30 text-green-400 border-green-800/50"
                  >
                    <Check size={10} className="mr-1" />
                    Matches {m}
                  </span>
                ))}
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

      <div className="bg-gradient-to-r from-[#FF6B35]/20 via-[#FF6B35]/15 to-[#FF6B35]/10 border-2 border-[#FF6B35]/40 rounded-lg p-4 shadow-lg shadow-[#FF6B35]/10 group-hover:shadow-[#FF6B35]/25 group-hover:shadow-xl transition-all duration-500">
        <div className="space-y-3">
          {emails.length > 0 ? (
            emails.map((email) => {
              const isCopied = copiedEmail === email;

              return (
                <div key={email} className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onCopyEmail(email)}
                    className="flex items-start gap-3 min-w-0 text-left group/email"
                    title={`Copy ${email}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center border border-[#FF6B35]/40 flex-shrink-0">
                      <Mail
                        size={16}
                        className="text-gray-200 group-hover/email:text-[#FF6B35] transition-colors duration-200"
                      />
                    </div>
                    <span className="text-[#FF6B35] font-bold text-sm sm:text-lg break-all leading-snug group-hover/email:text-white transition-colors duration-200">
                      {email}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCopyEmail(email)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl transition-all duration-300 border-2 inline-flex items-center gap-2 ${
                      isCopied
                        ? "bg-green-500/30 text-green-400 border-green-500/50 shadow-lg"
                        : "bg-[#FF6B35]/30 text-[#FF6B35] border-[#FF6B35]/50 hover:bg-[#FF6B35]/40 hover:scale-110 hover:shadow-lg hover:shadow-[#FF6B35]/30"
                    }`}
                    title="Copy email"
                  >
                    {isCopied ? (
                      <>
                        <Check size={18} />
                        <span className="hidden sm:inline text-xs font-semibold">
                          Copied
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        <span className="hidden sm:inline text-xs font-semibold">
                          Copy
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center border border-gray-700/60">
                <Mail size={16} className="text-gray-400" />
              </div>
              <span className="text-sm font-medium">No email</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {lead.openHours && (
          <div className="flex items-center gap-3 text-gray-400 text-sm bg-gray-800/20 border border-gray-700/40 rounded-lg p-3 group-hover:border-[#FF6B35]/30 group-hover:bg-[#FF6B35]/5 transition-all duration-300">
            <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 group-hover:border-[#FF6B35]/30 transition-all duration-300">
              <Clock
                size={14}
                className="text-gray-400 group-hover:text-[#FF6B35] transition-colors duration-300"
              />
            </div>
            <span className="truncate font-medium">{lead.openHours}</span>
          </div>
        )}

        {/* Website Section - Formatted professionally */}
        {lead.website && (
          <div className="flex items-start gap-3 text-gray-400 text-sm bg-gray-800/20 border border-gray-700/40 rounded-lg p-3 group-hover:border-[#FF6B35]/30 group-hover:bg-[#FF6B35]/5 transition-all duration-300">
            <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 group-hover:border-[#FF6B35]/30 transition-all duration-300">
              <Globe
                size={14}
                className="text-gray-400 group-hover:text-[#FF6B35] transition-colors duration-300"
              />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <a
                href={normalizeUrl(lead.website)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1 -mx-2 hover:bg-gray-800/40 transition-colors group/website"
              >
                <span className="flex items-start gap-2.5 min-w-0">
                  <span className="flex flex-col min-w-0">
                    <span className="text-gray-300 font-semibold group-hover/website:text-white transition-colors duration-200">
                      Website
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {lead.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                    </span>
                  </span>
                </span>
                <ArrowUpRight
                  size={16}
                  className="text-gray-500 group-hover/website:text-[#FF6B35] transition-colors duration-200 flex-shrink-0"
                />
              </a>
            </div>
          </div>
        )}

        {/* Social Media Section */}
        <div className="flex items-start gap-3 text-gray-400 text-sm bg-gray-800/20 border border-gray-700/40 rounded-lg p-3 group-hover:border-[#FF6B35]/30 group-hover:bg-[#FF6B35]/5 transition-all duration-300">
          <div className="w-8 h-8 rounded-md bg-gray-800/50 flex items-center justify-center border border-gray-700/50 group-hover:border-[#FF6B35]/30 transition-all duration-300">
            <Globe
              size={14}
              className="text-gray-400 group-hover:text-[#FF6B35] transition-colors duration-300"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {socialLinks.length === 0 ? (
              <span className="text-gray-500 font-medium">No social links</span>
            ) : (
              socialLinks.map(({ label, url, displayUrl, Icon }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1 -mx-2 hover:bg-gray-800/40 transition-colors group/social"
                >
                  <span className="flex items-start gap-2.5 min-w-0">
                    <Icon
                      size={16}
                      className="text-gray-400 group-hover/social:text-[#FF6B35] transition-colors duration-200 flex-shrink-0"
                    />
                    <span className="flex flex-col min-w-0">
                      <span className="text-gray-300 font-semibold group-hover/social:text-white transition-colors duration-200">
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
              ))
            )}
          </div>
        </div>
      </div>

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
