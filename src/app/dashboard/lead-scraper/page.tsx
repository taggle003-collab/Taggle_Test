"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import LeadScraperForm from "@/components/lead-scraper/LeadScraperForm";
import LeadCard from "@/components/lead-scraper/LeadCard";
import PaginationControls from "@/components/lead-scraper/PaginationControls";
import type { LeadSearchResult } from "@/lib/lead-types";

const pageSize = 10;

const LeadScraperPage = () => {
  const [country, setCountry] = useState("USA");
  const [category, setCategory] = useState("Tech");
  const [companySize, setCompanySize] = useState("");
  const [industrySubcategory, setIndustrySubcategory] = useState("");
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<LeadSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const resultsMessage = useMemo(() => {
    if (!hasSearched) {
      return "Enter ICP criteria to find leads.";
    }
    if (hasSearched && leads.length === 0 && !isLoading && !error) {
      return `No leads found for ${category}/${country}. Try different filters.`;
    }
    return "";
  }, [category, country, hasSearched, leads.length, isLoading, error]);

  const fetchLeads = async (pageNumber: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        country,
        category,
        page: pageNumber.toString(),
      });

      if (companySize) {
        params.append("companySize", companySize);
      }
      if (industrySubcategory) {
        params.append("industrySubcategory", industrySubcategory);
      }

      const response = await fetch(`/api/leads/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch leads");
      }

      const mappedLeads: LeadSearchResult[] = (data.leads || []).map((lead: any) => ({
        id: lead.id ?? `${lead.name}-${lead.email}`,
        name: lead.name ?? `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim(),
        email: lead.email ?? "",
        phone: lead.phone ?? undefined,
        website: lead.website ?? undefined,
        openHours: lead.openHours ?? undefined,
        socialMedia: Array.isArray(lead.socialMedia)
          ? lead.socialMedia
          : lead.socialMedia
            ? lead.socialMedia.split(",").map((item: string) => item.trim()).filter(Boolean)
            : [],
        category: lead.Category ?? lead.category ?? lead.industry ?? category,
        country: lead.Country ?? lead.country ?? country,
        companySize: lead.companySize ?? companySize,
        industrySubcategory: lead.industrySubcategory ?? industrySubcategory,
        company: lead.company ?? lead.website ?? lead.Company ?? "",
        title: lead.title ?? lead.position ?? lead.Title ?? "",
        location: lead.location ?? lead.Location ?? "",
      }));

      setLeads(mappedLeads);
      setTotalCount(data.totalCount ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setPage(data.page ?? pageNumber);
    } catch (fetchError) {
      console.error("[LEAD_SCRAPER] Error fetching leads:", fetchError);
      setError(fetchError instanceof Error ? fetchError.message : "Something went wrong.");
      setLeads([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    setPage(1);
    fetchLeads(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchLeads(newPage);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Lead Scraper</h1>
        <p className="text-gray-400 mt-2">
          Select ICP criteria, search, and browse qualified leads in one place.
        </p>
      </div>

      <LeadScraperForm
        country={country}
        category={category}
        companySize={companySize}
        industrySubcategory={industrySubcategory}
        isLoading={isLoading}
        onCountryChange={(value) => {
          setCountry(value);
          setPage(1);
        }}
        onCategoryChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
        onCompanySizeChange={(value) => {
          setCompanySize(value);
          setPage(1);
        }}
        onIndustrySubcategoryChange={(value) => {
          setIndustrySubcategory(value);
          setPage(1);
        }}
        onSearch={handleSearch}
      />

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Results</h2>
          {totalCount > 0 && (
            <p className="text-sm text-gray-400">
              Showing leads {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/40 text-red-300 rounded-xl p-4 flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5" />
            <div>
              <p className="font-medium">Something went wrong. Please try again.</p>
              <p className="text-sm text-red-200/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-10 text-center text-gray-400">
            <Loader2 className="mx-auto mb-3 animate-spin text-[#FF6B35]" size={32} />
            Searching leads...
          </div>
        )}

        {!isLoading && resultsMessage && (
          <div className="bg-[#1a1a1a] border border-dashed border-gray-800 rounded-2xl p-10 text-center text-gray-400">
            <Search className="mx-auto mb-3 text-gray-600" size={32} />
            {resultsMessage}
          </div>
        )}

        {!isLoading && leads.length > 0 && (
          <div className="grid gap-5">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>

      {!isLoading && totalPages > 1 && (
        <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </div>
  );
};

export default LeadScraperPage;
