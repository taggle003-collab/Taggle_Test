"use client";

import React, { useState, useEffect } from "react";
import { Lead } from "./LeadScraper";
import { Search } from "lucide-react";

interface LeadSelectorProps {
  onLeadSelect: (lead: Lead) => void;
  selectedLead: Lead | null;
}

export default function LeadSelector({ onLeadSelect, selectedLead }: LeadSelectorProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const savedLeads = localStorage.getItem("leads");
    if (savedLeads) {
      try {
        const parsedLeads = JSON.parse(savedLeads);
        setTimeout(() => setLeads(parsedLeads), 0);
      } catch (e) {
        console.error("Failed to load saved leads", e);
      }
    }
  }, []);

  const filteredLeads = leads.filter(lead =>
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Select a Lead</h2>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by email, company, name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredLeads.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No leads found. <a href="/dashboard/leads" className="text-blue-600 hover:underline">Search for leads first</a>
          </p>
        ) : (
          filteredLeads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => onLeadSelect(lead)}
              className={`w-full text-left p-3 rounded-lg border-2 transition ${
                selectedLead?.id === lead.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-sm">{lead.firstName} {lead.lastName}</div>
              <div className="text-xs text-gray-600">{lead.company}</div>
              <div className="text-xs text-gray-500">{lead.email}</div>
              <div className="text-xs text-gray-500 mt-1">{lead.title} • {lead.location}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
