"use client";

import React, { useState } from "react";
import ICPForm, { ICPCriteria } from "./ICPForm";
import { Mail, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  location: string;
  companySize: string;
  industry: string;
}

const LeadScraper = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastCriteria, setLastCriteria] = useState<ICPCriteria | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleScrape = async (criteria: ICPCriteria) => {
    setIsLoading(true);
    setMessage(null);
    setLastCriteria(criteria);
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
      const response = await fetch("/api/send-leads-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          leads,
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

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-xl">
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
        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">Scraped Leads</h3>
              <p className="text-gray-400 text-sm">Found {leads.length} matching prospects</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-orange-600 outline-none"
                />
              </div>

              <form onSubmit={handleSendEmail} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-black border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:border-orange-600 outline-none md:min-w-[200px]"
                  required
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center transition-colors disabled:opacity-50 whitespace-nowrap"
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
                  <th className="px-6 py-4">Name / Title</th>
                  <th className="px-6 py-4">Company / Industry</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-black/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{lead.name}</div>
                      <div className="text-gray-500 text-sm">{lead.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{lead.company}</div>
                      <div className="text-gray-500 text-sm">{lead.industry}</div>
                    </td>
                    <td className="px-6 py-4 text-orange-500 font-medium">{lead.email}</td>
                    <td className="px-6 py-4 text-gray-400">{lead.location}</td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
