"use client";

import React, { useState, useEffect } from "react";
import LeadFilterBar from "./LeadFilterBar";
import LeadCard from "./LeadCard";

import UpgradePrompt from "./UpgradePrompt";
import GlobalICPForm, { GlobalICPSettings } from "./GlobalICPForm";
import { Mail, Search, CheckCircle2, AlertCircle, Loader2, Copy, Check, ArrowUpDown, MessageSquare } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { hasFeature, getLeadsLimit } from "@/lib/feature-access";
import { useCraftMessages } from "@/lib/contexts/CraftMessagesContext";
import type { Lead } from "@/lib/lead-types";

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type SortField = "name" | "email" | "company" | "title" | "location" | "size" | "industry";
type SortOrder = "asc" | "desc";

const calculateICPScore = (lead: Lead, settings: GlobalICPSettings | null) => {
  if (!settings) return { score: 0, matches: [] as string[] };
  
  let score = 0;
  const matches: string[] = [];
  
  // Industry match
  if (settings.industries && settings.industries.length > 0) {
    if (settings.industries.some(i => lead.industry?.toLowerCase().includes(i.toLowerCase()))) {
      score += 30;
      matches.push("Industry");
    }
  }
  
  // Company Size match
  if (settings.companySize) {
     const leadSize = lead.companySize?.toLowerCase() || "";
     const targetSize = settings.companySize.toLowerCase();
     
     // specific check for startup mapping since data might be '1-10'
     if (targetSize === 'startup' && (leadSize === '1-10' || leadSize === '11-50' || leadSize === '1-50')) {
         score += 20;
         matches.push("Size");
     } else if (leadSize.includes(targetSize)) {
         score += 20;
         matches.push("Size");
     }
  }
  
  // Decision Makers match
  if (settings.decisionMakers) {
    const titles = settings.decisionMakers.split(",").map(t => t.trim().toLowerCase());
    if (titles.some(t => lead.title?.toLowerCase().includes(t))) {
      score += 30;
      matches.push("Role");
    }
  }

  return { score, matches };
};

const LeadScraper = () => {
  const { user } = useUser();
  const { openCraftMessages } = useCraftMessages();
  const userPlan = user?.unsafeMetadata?.plan as "lite" | "solo" | "pro" | undefined;
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  const canScrape = hasFeature(userPlan, userEmail, "leadScraping");
  const leadsLimit = getLeadsLimit(userPlan, userEmail);
  const hasNotifications = hasFeature(userPlan, userEmail, "realtimeNotifications");

  const [country, setCountry] = useState("USA");
  const [category, setCategory] = useState("Tech");
  
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [showICPPreferences, setShowICPPreferences] = useState(false);
  const [icpSettings, setIcpSettings] = useState<GlobalICPSettings | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("user_icp_preferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => setIcpSettings(parsed), 0);
      } catch (e) {
        console.error("Failed to load ICP settings", e);
      }
    }
  }, []);

  const fetchLeads = async (page: number = 1) => {
    setIsLoading(true);
    setMessage(null);
    setSelectedLeads(new Set());
    
    try {
      const queryParams = new URLSearchParams({
        country,
        category,
        page: page.toString(),
      });

      const response = await fetch(`/api/leads/search?${queryParams.toString()}`);
      
      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.error || "Too many searches. Please wait a moment before trying again.");
        }
        throw new Error("Failed to fetch leads");
      }

      const data = await response.json();

      if (data.success) {
        setAllLeads(data.leads);
        
        let leads = data.leads;
        // Sort by ICP score if available
        if (icpSettings) {
             leads = [...leads].sort((a: Lead, b: Lead) => {
                const scoreA = calculateICPScore(a, icpSettings).score;
                const scoreB = calculateICPScore(b, icpSettings).score;
                return scoreB - scoreA;
            });
        }
        
        setDisplayedLeads(leads);
        setCurrentPage(data.page);
        
        setPagination({
          page: 1,
          limit: 10,
          total: data.totalCount,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        });

        if (data.leads.length === 0) {
           setMessage({ type: "error", text: `No leads found for ${category} in ${country}. Try different filters.` });
        }
      } else {
        throw new Error(data.error || "Failed to fetch leads");
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong while fetching leads.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLeads(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchLeads(newPage);
  };

  // Sort handler - Client side sorting for the current page
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    
    // We only sort displayed leads since pagination is server-side now
    const sorted = sortLeads([...displayedLeads], field, sortField === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc");
    setDisplayedLeads(sorted);
  };

  const sortLeads = (leads: Lead[], field: SortField, order: SortOrder) => {
    return leads.sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          comparison = (a.email || "").localeCompare(b.email || "");
          break;
        case "company":
          comparison = (a.company || "").localeCompare(b.company || "");
          break;
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "location":
          comparison = (a.location || "").localeCompare(b.location || "");
          break;
        case "size":
          comparison = (a.companySize || "").localeCompare(b.companySize || "");
          break;
        case "industry":
          comparison = (a.industry || "").localeCompare(b.industry || "");
          break;
      }
      return order === "asc" ? comparison : -comparison;
    });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || displayedLeads.length === 0) return;

    setIsSending(true);
    setMessage(null);
    try {
      const leadsToSend = selectedLeads.size > 0 
        ? displayedLeads.filter(l => selectedLeads.has(l.id))
        : displayedLeads;

      const response = await fetch("/api/send-leads-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          leads: leadsToSend,
          criteria: { industry: category, location: country },
          page: currentPage,
          total: pagination?.total || leadsToSend.length,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.error || "Too many email sends. Please wait a moment before trying again.");
        }
        throw new Error("Failed to send email");
      }

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: `Successfully sent ${leadsToSend.length} leads to ${email}!` });
        setEmail("");
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send email. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === displayedLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(displayedLeads.map(l => l.id)));
    }
  };

  const handleDeleteLead = (id: string) => {
    // Just remove from view for now, as we can't delete from shared DB
    const newDisplayed = displayedLeads.filter(l => l.id !== id);
    setDisplayedLeads(newDisplayed);
    setSelectedLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
    });
  };

  const handleCopyEmail = async (emailToCopy: string) => {
    try {
      await navigator.clipboard.writeText(emailToCopy);
      setCopiedEmail(emailToCopy);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error("Failed to copy email:", err);
    }
  };

  if (!canScrape) {
    return (
      <div className="py-8">
        <UpgradePrompt
          requiredPlan="Lite"
          featureName="Lead Scraping"
          description="Lead scraping is available in all plans. Please upgrade to get started."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Find Your Leads</h2>
            <div className="text-xs text-gray-500 mt-1">
              Search through our database of verified leads
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Leads Limit: <span className="text-[#FF6B35] font-semibold">{leadsLimit >= 999999 ? "Unlimited" : leadsLimit}</span>/month
          </div>
        </div>
        
        <LeadFilterBar 
          country={country}
          setCountry={setCountry}
          category={category}
          setCategory={setCategory}
          onSearch={handleSearch}
          isLoading={isLoading}
          totalCount={pagination?.total}
        />
      </div>

      {/* ICP Preferences Section */}
      <GlobalICPForm 
        isOpen={showICPPreferences} 
        onToggle={() => setShowICPPreferences(!showICPPreferences)}
        onSave={(settings) => {
            setIcpSettings(settings);
            // Re-sort leads based on new settings
            const sorted = [...displayedLeads].sort((a, b) => {
                const scoreA = calculateICPScore(a, settings).score;
                const scoreB = calculateICPScore(b, settings).score;
                return scoreB - scoreA;
            });
            setDisplayedLeads(sorted);
        }}
      />

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === "success" ? "bg-green-900/20 text-green-400 border border-green-900/30" : "bg-red-900/20 text-red-400 border border-red-900/30"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="me-3 flex-shrink-0" /> : <AlertCircle className="me-3 flex-shrink-0" />}
          <span className="text-sm sm:text-base">{message.text}</span>
        </div>
      )}

      {displayedLeads.length === 0 && !isLoading && !message && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-12 text-center">
          <Search className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">Start Searching</h3>
          <p className="text-gray-400">Select your filters above and click &quot;Search&quot; to find leads</p>
        </div>
      )}

      {displayedLeads.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Results</h3>
                <p className="text-gray-400 text-sm">
                   Page {pagination?.page} of {pagination?.pages}
                </p>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-[#FF6B35] outline-none min-h-[44px]"
                />
              </div>
            </div>

            <form onSubmit={handleSendEmail} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-[#FF6B35] outline-none min-h-[44px]"
                required
              />
              <button
                type="submit"
                disabled={isSending || displayedLeads.length === 0}
                className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors disabled:opacity-50 whitespace-nowrap min-h-[44px]"
              >
                {isSending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Mail className="me-2" size={18} />
                    {selectedLeads.size > 0 ? `Send ${selectedLeads.size} Selected` : "Send Current Page"}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === displayedLeads.length && displayedLeads.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 accent-[#FF6B35] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4">Founder</th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Lead Name
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("email")}>
                    <div className="flex items-center gap-1">
                      Email
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("company")}>
                    <div className="flex items-center gap-1">
                      Company
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("title")}>
                    <div className="flex items-center gap-1">
                      Title
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("location")}>
                    <div className="flex items-center gap-1">
                      Location
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("industry")}>
                    <div className="flex items-center gap-1">
                      Industry
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {displayedLeads
                    .filter(l => 
                        !searchTerm || 
                        `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (l.company || "").toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((lead) => {
                      const icpMatch = calculateICPScore(lead, icpSettings);
                      return (
                      <tr key={lead.id} className="hover:bg-black/50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                            className="w-4 h-4 accent-[#FF6B35] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                              <span className="text-gray-500 text-xs">{(lead.firstName[0] || "") + (lead.lastName[0] || "")}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-sm font-medium">{lead.firstName} {lead.lastName}</span>
                              {icpMatch.score > 0 && (
                                <span className="text-[10px] text-green-400 font-bold flex items-center gap-1 mt-0.5">
                                    <Check size={10} /> ICP MATCH
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-white font-medium">{lead.firstName} {lead.lastName}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF6B35] font-medium">{lead.email}</span>
                            <button
                              onClick={() => handleCopyEmail(lead.email)}
                              className="text-gray-500 hover:text-[#FF6B35] transition-colors"
                              title="Copy email"
                            >
                              {copiedEmail === lead.email ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-white">{lead.company}</td>
                        <td className="px-4 py-4 text-gray-400">{lead.title}</td>
                        <td className="px-4 py-4 text-gray-400">{lead.location}</td>
                        <td className="px-4 py-4 text-gray-400">{lead.industry}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openCraftMessages(lead)}
                              className="text-gray-500 hover:text-blue-500 transition-colors"
                              title="Craft message"
                            >
                              <MessageSquare size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === displayedLeads.length && displayedLeads.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 accent-[#FF6B35] cursor-pointer"
                />
                Select all on page
              </label>
            </div>
            
            {displayedLeads
                .filter(l => 
                    !searchTerm || 
                    `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    (l.company || "").toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={handleSelectLead}
                onDelete={handleDeleteLead}
                onCopyEmail={handleCopyEmail}
                copiedEmail={copiedEmail}
                icpMatch={calculateICPScore(lead, icpSettings)}
              />
            ))}
          </div>

          {/* Pagination intentionally disabled: API always returns up to 10 leads. */}
        </div>
      )}

      {hasNotifications && allLeads.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          </div>
          <div>
            <p className="text-blue-200 text-sm font-medium">Real-time Notifications Enabled</p>
            <p className="text-blue-300/70 text-xs mt-1">You&apos;ll receive instant alerts for new leads matching your ICP</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadScraper;
