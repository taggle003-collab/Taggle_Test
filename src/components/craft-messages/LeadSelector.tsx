"use client";

import React, { useState, useEffect } from "react";
import { Lead } from "../LeadScraper";
import { Search, User, Building2, MapPin } from "lucide-react";

interface LeadSelectorProps {
  onLeadSelect: (lead: Lead | null) => void;
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
        // Using requestAnimationFrame to avoid synchronous setState warning
        requestAnimationFrame(() => setLeads(parsedLeads));
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Select a Lead</h3>
        {selectedLead && (
          <button 
            onClick={() => onLeadSelect(null)}
            className="text-xs text-[#FF6B35] hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {selectedLead ? (
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-4 flex items-start gap-4 shadow-lg shadow-blue-900/10">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30 text-blue-400">
            <User size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-base">
              {selectedLead.firstName} {selectedLead.lastName}
            </div>
            <div className="text-blue-300 text-sm flex items-center gap-1.5 mt-0.5">
              <Building2 size={12} />
              {selectedLead.company}
            </div>
            <div className="text-gray-400 text-xs flex items-center gap-1.5 mt-1">
              <MapPin size={12} />
              {selectedLead.location}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search leads by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:border-[#FF6B35] outline-none transition-all"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
                <p className="text-gray-500 text-sm">No leads found in your history.</p>
                <p className="text-gray-600 text-xs mt-1">Try scraping some leads first.</p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => onLeadSelect(lead)}
                  className="w-full text-left p-3 rounded-xl border border-gray-800 bg-gray-900/30 hover:bg-gray-800/50 hover:border-[#FF6B35]/30 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-white group-hover:text-[#FF6B35] transition-colors">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{lead.company} • {lead.title}</div>
                    </div>
                    <div className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                      {lead.location}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
