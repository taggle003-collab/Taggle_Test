"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import CountrySelector from "@/components/leads/CountrySelector";
import CitySelector from "@/components/leads/CitySelector";
import LeadsTable from "@/components/leads/LeadsTable";
import EmptyState from "@/components/leads/EmptyState";
import type { Lead } from "@/lib/supabase-client";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/leads");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }

      if (data.success) {
        setLeads(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch leads");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching leads:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      setError(null);

      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: country || undefined,
          city: city || undefined,
          businessType: businessType || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      if (data.success) {
        setLeads(data.data || []);
      } else {
        throw new Error(data.error || "Search failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error searching leads:", error);
      setError(error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setCountry("");
    setCity("");
    setBusinessType("");
    fetchLeads();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">My Leads</h1>
          <p className="text-gray-400">
            Leads stored in your Supabase database.
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading leads...</div>
        </div>
      </div>
    );
  }

  const isTrulyEmpty = leads.length === 0 && !country && !city && !businessType;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-white">My Leads</h1>
            <p className="text-gray-400">Leads stored in your Supabase database.</p>
          </div>
          <Link
            href="/dashboard/leads/scraper"
            className="bg-[#2a2a2a] border border-gray-700 text-white px-4 py-2 rounded-lg hover:border-[#FF6B35] transition"
          >
            Go to Lead Scraper
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {isTrulyEmpty ? (
        <EmptyState />
      ) : (
        <>
          <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Search / Filter</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <CountrySelector value={country} onChange={setCountry} />
              <CitySelector country={country} value={city} onChange={setCity} />

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Business Type
                </label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder="e.g., SaaS, E-commerce..."
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={searching}
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                <Search size={18} />
                {searching ? "Searching..." : "Search"}
              </button>

              <button
                onClick={handleReset}
                disabled={searching}
                className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>

          <LeadsTable leads={leads} />
        </>
      )}
    </div>
  );
}
