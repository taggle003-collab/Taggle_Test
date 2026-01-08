"use client";

import React, { useState } from "react";
import ICPForm, { ICPCriteria } from "./ICPForm";
import LeadCard from "./LeadCard";
import Pagination from "./Pagination";
import { Mail, Search, CheckCircle2, AlertCircle, Loader2, Copy, Trash2, Check, ArrowUpDown } from "lucide-react";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
  linkedInProfile?: string;
  verified?: boolean;
  accuracy?: number;
  founderName?: string;
  founderTitle?: string;
  founderImage?: string;
}

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

const LeadScraper = () => {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastCriteria, setLastCriteria] = useState<ICPCriteria | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [searchesRemaining, setSearchesRemaining] = useState<number | null>(null);
  const [rateLimitReset, setRateLimitReset] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  React.useEffect(() => {
    if (!rateLimitReset) return;

    const timer = setInterval(() => {
      const now = new Date();
      const reset = new Date(rateLimitReset);
      const diff = reset.getTime() - now.getTime();

      if (diff <= 0) {
        setRateLimitReset(null);
        setSearchesRemaining(3);
        setCountdown("");
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes} minutes ${seconds} seconds`);
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitReset]);

  const handleScrape = async (criteria: ICPCriteria) => {
    setIsLoading(true);
    setMessage(null);
    setLastCriteria(criteria);
    setSelectedLeads(new Set());
    setCurrentPage(1);
    setSearchTerm("");
    
    try {
      // First, fetch all leads to store them locally
      const response = await fetch("/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...criteria, page: 1, limit: 1000 }), // Fetch all
      });

      if (response.status === 429) {
        const data = await response.json();
        setRateLimitReset(data.resetTime);
        setSearchesRemaining(0);
        setMessage({ type: "error", text: data.message });
        setIsLoading(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to scrape leads");

      const data = await response.json();
      
      setSearchesRemaining(data.searchesRemaining);
      if (data.rateLimitReset) setRateLimitReset(data.rateLimitReset);

      if (data.leads.length === 0) {
        setMessage({ type: "error", text: "No leads found matching your criteria. Please try different filters." });
        setAllLeads([]);
        setDisplayedLeads([]);
        setPagination(null);
      } else {
        setAllLeads(data.leads);
        // Display first page
        const firstPageLeads = data.leads.slice(0, itemsPerPage);
        setDisplayedLeads(firstPageLeads);
        
        // Set pagination info
        const totalPages = Math.ceil(data.leads.length / itemsPerPage);
        setPagination({
          page: 1,
          limit: itemsPerPage,
          total: data.leads.length,
          pages: totalPages,
          hasNext: totalPages > 1,
          hasPrev: false,
        });
        
        setMessage({ type: "success", text: `Found ${data.leads.length} verified leads!` });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong while scraping leads." });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredAndSorted = getSortedLeads(getFilteredLeads(allLeads));
    setDisplayedLeads(filteredAndSorted.slice(startIndex, endIndex));
    setSelectedLeads(new Set()); // Clear selection when changing pages
    
    // Update pagination info
    if (pagination) {
      const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
      setPagination({
        ...pagination,
        page: newPage,
        pages: totalPages,
        hasNext: newPage < totalPages,
        hasPrev: newPage > 1,
      });
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    const filteredAndSorted = getSortedLeads(getFilteredLeads(allLeads));
    setDisplayedLeads(filteredAndSorted.slice(0, newLimit));
    
    // Update pagination info
    if (pagination) {
      const totalPages = Math.ceil(filteredAndSorted.length / newLimit);
      setPagination({
        ...pagination,
        page: 1,
        limit: newLimit,
        pages: totalPages,
        hasNext: totalPages > 1,
        hasPrev: false,
      });
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || allLeads.length === 0) return;

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
          criteria: lastCriteria,
          page: currentPage,
          total: pagination?.total || leadsToSend.length,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      setMessage({ type: "success", text: `Successfully sent ${leadsToSend.length} leads to ${email}!` });
      setEmail("");
    } catch (error) {
      setMessage({ type: "error", text: "Failed to send email. Please try again." });
      console.error(error);
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
    const newAllLeads = allLeads.filter(l => l.id !== id);
    setAllLeads(newAllLeads);
    
    // Update displayed leads for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredAndSorted = getSortedLeads(getFilteredLeads(newAllLeads));
    setDisplayedLeads(filteredAndSorted.slice(startIndex, endIndex));
    
    // Remove from selection
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    
    // Update pagination
    if (pagination) {
      const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
      setPagination({
        ...pagination,
        total: filteredAndSorted.length,
        pages: totalPages,
        hasNext: currentPage < totalPages,
      });
    }
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    
    // Re-apply sorting and update displayed leads
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const filteredAndSorted = getSortedLeads(getFilteredLeads(allLeads));
    setDisplayedLeads(filteredAndSorted.slice(startIndex, endIndex));
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    
    const filteredAndSorted = getSortedLeads(getFilteredLeads(allLeads, value));
    setDisplayedLeads(filteredAndSorted.slice(0, itemsPerPage));
    
    // Update pagination
    if (pagination) {
      const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
      setPagination({
        ...pagination,
        page: 1,
        total: filteredAndSorted.length,
        pages: totalPages,
        hasNext: totalPages > 1,
        hasPrev: false,
      });
    }
  };

  const getFilteredLeads = (leadsToFilter: Lead[], search?: string) => {
    const searchValue = search !== undefined ? search : searchTerm;
    if (!searchValue) return leadsToFilter;
    
    return leadsToFilter.filter(lead => 
      `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchValue.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchValue.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      lead.title.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  const getSortedLeads = (leadsToSort: Lead[]) => {
    return [...leadsToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "company":
          comparison = a.company.localeCompare(b.company);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "location":
          comparison = a.location.localeCompare(b.location);
          break;
        case "size":
          comparison = a.companySize.localeCompare(b.companySize);
          break;
        case "industry":
          comparison = a.industry.localeCompare(b.industry);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-800 shadow-xl">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Define Your Ideal Customer Profile</h2>
        <ICPForm 
          onScrape={handleScrape} 
          isLoading={isLoading} 
          searchesRemaining={searchesRemaining}
          rateLimitReset={rateLimitReset}
          countdown={countdown}
        />
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === "success" ? "bg-green-900/20 text-green-400 border border-green-900/30" : "bg-red-900/20 text-red-400 border border-red-900/30"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="me-3 flex-shrink-0" /> : <AlertCircle className="me-3 flex-shrink-0" />}
          <span className="text-sm sm:text-base">{message.text}</span>
        </div>
      )}

      {allLeads.length === 0 && !isLoading && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-12 text-center">
          <Search className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Leads Yet</h3>
          <p className="text-gray-400">Define your ICP criteria above and click "Scrape Leads" to get started</p>
        </div>
      )}

      {allLeads.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">Scraped Leads</h3>
                <p className="text-gray-400 text-sm">
                  {pagination ? `${pagination.total} verified leads found` : `${allLeads.length} leads`}
                </p>
              </div>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
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
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("size")}>
                    <div className="flex items-center gap-1">
                      Size
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
                {displayedLeads.map((lead) => (
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
                        {lead.founderImage ? (
                          <img 
                            src={lead.founderImage} 
                            alt={lead.founderName} 
                            className="w-10 h-10 rounded-full border border-gray-700 object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                            <span className="text-gray-500 text-xs">?</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-medium">{lead.founderName}</span>
                          <span className="text-gray-500 text-[10px]">{lead.founderTitle}</span>
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
                    <td className="px-4 py-4 text-gray-400">{lead.companySize}</td>
                    <td className="px-4 py-4 text-gray-400">{lead.industry}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove lead"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
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
            
            {displayedLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={selectedLeads.has(lead.id)}
                onSelect={handleSelectLead}
                onDelete={handleDeleteLead}
                onCopyEmail={handleCopyEmail}
                copiedEmail={copiedEmail}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LeadScraper;
