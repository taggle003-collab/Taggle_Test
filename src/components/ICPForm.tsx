"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Loader2, X, ChevronDown, Check } from "lucide-react";

export interface ICPCriteria {
  industry: string;
  companySize: string;
  location: string;
  jobTitles: string[];
  annualRevenue?: string;
  fundingStage?: string;
  customICP?: string;
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

const locationOptions = [
  "India", "USA", "Canada", "United Kingdom", "Germany", "France", 
  "Australia", "Japan", "Singapore", "Dubai", "UAE", "China", 
  "Brazil", "Mexico", "Spain", "Italy", "Netherlands", "Sweden",
  "Switzerland", "Ireland", "South Korea", "Hong Kong", "New Zealand",
  "Israel", "Russia", "Poland", "Turkey", "Indonesia", "Vietnam"
];

const ICPForm = ({ onScrape, isLoading }: ICPFormProps) => {
  const [criteria, setCriteria] = useState<ICPCriteria>({
    industry: "",
    companySize: "",
    location: "",
    jobTitles: [],
    annualRevenue: "",
    fundingStage: "",
    customICP: "",
  });
  const [showJobTitles, setShowJobTitles] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [validationError, setValidationError] = useState("");
  const locationInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredLocations = locationOptions.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleJobTitleToggle = (title: string) => {
    setCriteria((prev) => ({
      ...prev,
      jobTitles: prev.jobTitles.includes(title)
        ? prev.jobTitles.filter((t) => t !== title)
        : [...prev.jobTitles, title],
    }));
  };

  const handleLocationSelect = (location: string) => {
    setCriteria((prev) => ({ ...prev, location }));
    setLocationSearch("");
    setShowLocationDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    // Location is REQUIRED
    if (!criteria.location || criteria.location.trim().length === 0) {
      setValidationError("Location is required. Please select a location.");
      return;
    }

    // Check if user has filled either custom ICP or at least one structured field
    const hasCustomICP = criteria.customICP && criteria.customICP.trim().length > 0;
    const hasAtLeastOneStructuredField = 
      criteria.industry || 
      criteria.companySize || 
      criteria.jobTitles.length > 0 ||
      criteria.annualRevenue ||
      criteria.fundingStage;

    if (!hasCustomICP && !hasAtLeastOneStructuredField) {
      setValidationError("Please define ICP by selecting at least one filter or providing a custom description");
      return;
    }

    onScrape(criteria);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 space-y-4">
      {validationError && (
        <div className="bg-red-900/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          {validationError}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Custom ICP Description (Optional)
          </label>
          <textarea
            name="customICP"
            placeholder="e.g., 'Early-stage SaaS startups in B2B marketing space with product-market fit'"
            value={criteria.customICP || ""}
            onChange={(e) => setCriteria((prev) => ({ ...prev, customICP: e.target.value }))}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none min-h-[80px] resize-y"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe your ideal customer profile in your own words, or use the structured fields below
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1a1a1a] text-gray-500">OR use structured fields</span>
          </div>
        </div>
      </div>

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
          >
            <option value="">Any industry</option>
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
          >
            <option value="">Any size</option>
            <option value="1-10">1-10 employees</option>
            <option value="10-50">10-50 employees</option>
            <option value="50-100">50-100 employees</option>
            <option value="100-500">100-500 employees</option>
            <option value="500-1000">500-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Location <span className="text-[#FF6B35]">*</span>
          </label>
          <div className="relative">
            <input
              ref={locationInputRef}
              type="text"
              name="location"
              placeholder="Search location..."
              value={showLocationDropdown ? locationSearch : criteria.location}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setShowLocationDropdown(true);
              }}
              onFocus={() => setShowLocationDropdown(true)}
              className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
            />
            <ChevronDown 
              size={18} 
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`}
            />
          </div>
          
          {showLocationDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleLocationSelect(loc)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-[#FF6B35]/10 transition-colors flex items-center justify-between ${
                      criteria.location === loc ? 'text-[#FF6B35]' : 'text-white'
                    }`}
                  >
                    <span>{loc}</span>
                    {criteria.location === loc && <Check size={16} />}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm">No locations found</div>
              )}
            </div>
          )}
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
              <ChevronDown size={18} className={`transition-transform ${showJobTitles ? 'rotate-180' : ''}`} />
            </button>
            
            {showJobTitles && (
              <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {jobTitleOptions.map((title) => (
                  <label
                    key={title}
                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#FF6B35]/10 cursor-pointer"
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
        disabled={isLoading}
        className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 min-h-[44px]"
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
