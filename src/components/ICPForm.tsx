"use client";

import React, { useState } from "react";
import { Search, Loader2, X, ChevronDown, Check } from "lucide-react";

export interface ICPCriteria {
  industry: string;
  companySize: string;
  location: string;
  jobTitles: string[];
  annualRevenue?: string;
  fundingStage?: string;
}

interface ICPFormProps {
  onScrape: (criteria: ICPCriteria) => void;
  isLoading: boolean;
}

const industries = [
  "SaaS", "Healthcare", "Finance", "Manufacturing", "Retail", "Tech", "Other"
];

const jobTitleOptions = [
  "CEO", "CTO", "Founder", "VP Sales", "Sales Director", "Marketing Manager", "Other"
];

const revenueOptions = [
  "$0-1M", "$1-10M", "$10-50M", "$50M+"
];

const fundingOptions = [
  "Pre-seed", "Seed", "Series A", "Series B+", "Bootstrapped"
];

const ICPForm = ({ onScrape, isLoading }: ICPFormProps) => {
  const [criteria, setCriteria] = useState<ICPCriteria>({
    industry: "",
    companySize: "",
    location: "",
    jobTitles: [],
    annualRevenue: "",
    fundingStage: "",
  });
  const [showJobTitles, setShowJobTitles] = useState(false);

  const handleJobTitleToggle = (title: string) => {
    setCriteria((prev) => ({
      ...prev,
      jobTitles: prev.jobTitles.includes(title)
        ? prev.jobTitles.filter((t) => t !== title)
        : [...prev.jobTitles, title],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScrape(criteria);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Industry / Vertical
          </label>
          <select
            name="industry"
            value={criteria.industry}
            onChange={(e) => setCriteria((prev) => ({ ...prev, industry: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            required
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Company Size
          </label>
          <select
            name="companySize"
            value={criteria.companySize}
            onChange={(e) => setCriteria((prev) => ({ ...prev, companySize: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            required
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="10-50">10-50 employees</option>
            <option value="50-100">50-100 employees</option>
            <option value="100-500">100-500 employees</option>
            <option value="500-1000">500-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            placeholder="e.g. USA, Europe, India"
            value={criteria.location}
            onChange={(e) => setCriteria((prev) => ({ ...prev, location: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Job Titles (select multiple)
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowJobTitles(!showJobTitles)}
              className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-left text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none flex items-center justify-between"
            >
              {criteria.jobTitles.length > 0
                ? `${criteria.jobTitles.length} selected`
                : "Select job titles"}
              <ChevronDown size={18} />
            </button>
            
            {showJobTitles && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {jobTitleOptions.map((title) => (
                  <label
                    key={title}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-[#FF6B35]/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={criteria.jobTitles.includes(title)}
                      onChange={() => handleJobTitleToggle(title)}
                      className="w-4 h-4 accent-[#FF6B35]"
                    />
                    <span className="text-white">{title}</span>
                  </label>
                ))}
              </div>
            )}
            
            {criteria.jobTitles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {criteria.jobTitles.map((title) => (
                  <span
                    key={title}
                    className="inline-flex items-center gap-1 bg-[#FF6B35]/20 text-[#FF6B35] px-2 py-1 rounded text-xs"
                  >
                    {title}
                    <button
                      type="button"
                      onClick={() => handleJobTitleToggle(title)}
                      className="hover:text-orange-300"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Annual Revenue (optional)
          </label>
          <select
            name="annualRevenue"
            value={criteria.annualRevenue || ""}
            onChange={(e) => setCriteria((prev) => ({ ...prev, annualRevenue: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
          >
            <option value="">Any revenue</option>
            {revenueOptions.map((revenue) => (
              <option key={revenue} value={revenue}>{revenue}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Funding Stage (optional)
          </label>
          <select
            name="fundingStage"
            value={criteria.fundingStage || ""}
            onChange={(e) => setCriteria((prev) => ({ ...prev, fundingStage: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
          >
            <option value="">Any stage</option>
            {fundingOptions.map((funding) => (
              <option key={funding} value={funding}>{funding}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || criteria.jobTitles.length === 0}
        className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin me-2" size={20} />
            Scraping Leads...
          </>
        ) : (
          <>
            <Search className="me-2" size={20} />
            Scrape Leads
          </>
        )}
      </button>
    </form>
  );
};

export default ICPForm;
