"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";

interface LeadScraperFormProps {
  country: string;
  category: string;
  companySize: string;
  industrySubcategory: string;
  isLoading: boolean;
  onCountryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCompanySizeChange: (value: string) => void;
  onIndustrySubcategoryChange: (value: string) => void;
  onSearch: () => void;
}

const LeadScraperForm = ({
  country,
  category,
  companySize,
  industrySubcategory,
  isLoading,
  onCountryChange,
  onCategoryChange,
  onCompanySizeChange,
  onIndustrySubcategoryChange,
  onSearch,
}: LeadScraperFormProps) => {
  const [localSubcategory, setLocalSubcategory] = useState(industrySubcategory);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onIndustrySubcategoryChange(localSubcategory);
    }, 300);

    return () => clearTimeout(timeout);
  }, [localSubcategory, onIndustrySubcategoryChange]);

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-xl">
      <div>
        <h2 className="text-xl font-semibold text-white">Ideal Customer Profile</h2>
        <p className="text-sm text-gray-400 mt-1">
          Select your ICP criteria to search curated leads from our database.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
          <select
            value={country}
            onChange={(event) => onCountryChange(event.target.value)}
            className="w-full rounded-lg bg-black border border-gray-700 text-white px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="USA">USA</option>
            <option value="India">India</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full rounded-lg bg-black border border-gray-700 text-white px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="Tech">Tech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Company Size</label>
          <select
            value={companySize}
            onChange={(event) => onCompanySizeChange(event.target.value)}
            className="w-full rounded-lg bg-black border border-gray-700 text-white px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
          >
            <option value="">Any</option>
            <option value="10-50">10-50</option>
            <option value="50-100">50-100</option>
            <option value="100-500">100-500</option>
            <option value="500+">500+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Industry Subcategory</label>
          <input
            value={localSubcategory}
            onChange={(event) => setLocalSubcategory(event.target.value)}
            placeholder="SaaS, Medical Clinic, Accounting"
            className="w-full rounded-lg bg-black border border-gray-700 text-white px-3 py-2 focus:border-[#FF6B35] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-2.5 text-white font-semibold transition-colors hover:bg-[#e55a2b] disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>
    </div>
  );
};

export default LeadScraperForm;
