"use client";

import React, { useState } from "react";
import ICPForm, { ICPCriteria } from "./ICPForm";
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
}

type SortField = "name" | "email" | "company" | "title" | "location" | "size" | "industry";
type SortOrder = "asc" | "desc";

const LeadScraper = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
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

  const handleScrape = async (criteria: ICPCriteria) => {
    setIsLoading(true);
    setMessage(null);
    setLastCriteria(criteria);
    setSelectedLeads(new Set());
    try {
      const response = await fetch("/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      if (!response.ok) throw new Error("Failed to scrape leads");

      const data = await response.json();
      setLeads(data.leads);
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong while scraping leads." });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || leads.length === 0) return;

    setIsSending(true);
    setMessage(null);
    try {
      const leadsToSend = selectedLeads.size > 0 
        ? leads.filter(l => selectedLeads.has(l.id))
        : leads;

      const response = await fetch("/api/send-leads-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          leads: leadsToSend,
          criteria: lastCriteria,
        }),
      });

      if (!response.ok) throw new Error("Failed to send email");

      setMessage({ type: "success", text: `Leads successfully sent to ${email}!` });
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
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
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

  const filteredLeads = getSortedLeads(leads.filter(lead => 
    `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.title.toLowerCase().includes(searchTerm.toLowerCase())
  ));

  return (
    <div className="space-y-8">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Define Your Ideal Customer Profile</h2>
        <ICPForm onScrape={handleScrape} isLoading={isLoading} />
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === "success" ? "bg-green-900/20 text-green-400 border border-green-900/30" : "bg-red-900/20 text-red-400 border border-red-900/30"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="me-3" /> : <AlertCircle className="me-3" />}
          {message.text}
        </div>
      )}

      {leads.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">Scraped Leads</h3>
              <p className="text-gray-400 text-sm">Found {filteredLeads.length} matching prospects</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-[#FF6B35] outline-none"
                />
              </div>

              <form onSubmit={handleSendEmail} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-[#FF6B35] outline-none md:min-w-[200px]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isSending ? <Loader2 className="animate-spin" size={18} /> : <Mail className="me-2" size={18} />}
                  Send Leads
                </button>
              </form>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 accent-[#FF6B35] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-[#FF6B35] transition-colors" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
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
                {filteredLeads.map((lead) => (
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
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      No leads matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadScraper;
