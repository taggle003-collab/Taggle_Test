"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, X, ChevronDown, Save, Trash2, Copy, RefreshCw, Info, Sparkles } from "lucide-react";
import { saveICPProfile, loadICPProfile, getAllICPProfiles, deleteICPProfile, duplicateICPProfile, incrementProfileUsage, SavedICPProfile } from "@/lib/icp-utils";

export interface ICPCriteria {
  industry: string;
  companySize: string;
  location: string;
  jobTitles: string[];
  annualRevenue?: string;
  fundingStage?: string;
  customICP?: string;
  qualityScore?: number;
}

interface AdvancedICPFormProps {
  onScrape: (criteria: ICPCriteria) => void;
  isLoading: boolean;
  searchesRemaining: number | null;
  rateLimitReset: string | null;
  countdown: string;
  maxProfiles: number;
  userPlan: "solo" | "pro";
}

const industries = [
  "SaaS", "Healthcare", "Finance", "Manufacturing", "Retail", "Tech", "E-commerce", "Education", "Real Estate", "Other"
];

const jobTitleOptions = [
  "CEO", "CTO", "CFO", "COO", "Founder", "Co-Founder", "VP Sales", "VP Engineering", "VP Marketing",
  "Sales Director", "Marketing Manager", "Product Manager", "Engineering Manager", "Other"
];

const revenueOptions = [
  "Under $1M",
  "$1M - $10M",
  "$10M - $100M",
  "$100M - $1B",
  "$1B+"
];

const fundingOptions = [
  "Bootstrapped",
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C+"
];

const AdvancedICPForm = ({ onScrape, isLoading, searchesRemaining, rateLimitReset, countdown, maxProfiles, userPlan }: AdvancedICPFormProps) => {
  const [criteria, setCriteria] = useState<ICPCriteria>({
    industry: "",
    companySize: "",
    location: "",
    jobTitles: [],
    annualRevenue: "",
    fundingStage: "",
    customICP: "",
    qualityScore: 70,
  });
  const [showJobTitles, setShowJobTitles] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<SavedICPProfile[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Load saved profiles on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSavedProfiles(getAllICPProfiles());
    }
  }, []);

  const handleJobTitleToggle = (title: string) => {
    // Limit to 10 job titles for advanced plans
    if (!criteria.jobTitles.includes(title) && criteria.jobTitles.length >= 10) {
      setValidationError("Maximum 10 job titles allowed");
      return;
    }
    
    setValidationError("");
    setCriteria((prev) => ({
      ...prev,
      jobTitles: prev.jobTitles.includes(title)
        ? prev.jobTitles.filter((t) => t !== title)
        : [...prev.jobTitles, title],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchesRemaining === 0 && rateLimitReset) return;
    
    setValidationError("");

    // Check if user has filled either custom ICP or at least one field
    const hasCustomICP = criteria.customICP && criteria.customICP.trim().length > 0;
    const hasAnyField = criteria.industry || criteria.companySize || criteria.location || 
                        criteria.jobTitles.length > 0 || criteria.annualRevenue || criteria.fundingStage;

    if (!hasCustomICP && !hasAnyField) {
      setValidationError("Please provide either a custom ICP description or at least one search criterion");
      return;
    }

    onScrape(criteria);
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) {
      alert("Please enter a profile name");
      return;
    }

    if (savedProfiles.length >= maxProfiles) {
      alert(`You've reached the maximum of ${maxProfiles} saved profiles for ${userPlan === "solo" ? "Solo" : "Pro"} plan`);
      return;
    }

    const profile = saveICPProfile({
      name: profileName,
      industry: criteria.industry ? [criteria.industry] : undefined,
      companySize: criteria.companySize ? [criteria.companySize] : undefined,
      location: criteria.location ? [criteria.location] : undefined,
      jobTitles: criteria.jobTitles.length > 0 ? criteria.jobTitles : undefined,
      annualRevenue: criteria.annualRevenue || undefined,
      fundingStage: criteria.fundingStage ? [criteria.fundingStage] : undefined,
      customICP: criteria.customICP || undefined,
      qualityScore: criteria.qualityScore,
    });

    setSavedProfiles(getAllICPProfiles());
    setShowSaveModal(false);
    setProfileName("");
    alert("Profile saved successfully!");
  };

  const handleLoadProfile = (profile: SavedICPProfile) => {
    setCriteria({
      industry: profile.industry?.[0] || "",
      companySize: profile.companySize?.[0] || "",
      location: profile.location?.[0] || "",
      jobTitles: profile.jobTitles || [],
      annualRevenue: profile.annualRevenue || "",
      fundingStage: profile.fundingStage?.[0] || "",
      customICP: profile.customICP || "",
      qualityScore: profile.qualityScore || 70,
    });
    incrementProfileUsage(profile.id);
    setSavedProfiles(getAllICPProfiles());
    setShowLoadModal(false);
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm("Are you sure you want to delete this profile?")) {
      deleteICPProfile(id);
      setSavedProfiles(getAllICPProfiles());
    }
  };

  const handleDuplicateProfile = (id: string) => {
    duplicateICPProfile(id);
    setSavedProfiles(getAllICPProfiles());
  };

  const handleClearForm = () => {
    setCriteria({
      industry: "",
      companySize: "",
      location: "",
      jobTitles: [],
      annualRevenue: "",
      fundingStage: "",
      customICP: "",
      qualityScore: 70,
    });
    setValidationError("");
  };

  const isLocked = searchesRemaining === 0 && Boolean(rateLimitReset);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800 space-y-4">
        {/* Header with Plan Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gradient-to-r from-[#FF6B35] to-orange-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
              <Sparkles size={12} />
              Advanced ICP Matching
            </span>
            <span className="text-xs text-gray-500">
              {savedProfiles.length}/{maxProfiles === 999 ? "∞" : maxProfiles} profiles
            </span>
          </div>
          {searchesRemaining !== null && (
            <div className="text-sm font-medium text-gray-400">
              Searches: <span className={searchesRemaining === 0 ? "text-red-500" : "text-[#FF6B35]"}>{searchesRemaining}/3</span>
            </div>
          )}
        </div>

        {isLocked && (
          <div className="text-sm font-medium text-red-400 animate-pulse text-center py-2 bg-red-900/10 rounded-lg">
            Try again in: {countdown}
          </div>
        )}

        <div className="bg-gradient-to-r from-[#FF6B35]/10 to-orange-600/10 border border-[#FF6B35]/30 text-orange-200 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Advanced ICP matching with multiple criteria and quality scoring</p>
          <p className="text-xs text-orange-300">Use multiple filters, save profiles, and get quality-scored leads</p>
        </div>

        {/* Profile Management Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            disabled={isLocked}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition disabled:opacity-50"
          >
            <Save size={16} />
            Save Profile
          </button>
          <button
            type="button"
            onClick={() => setShowLoadModal(true)}
            disabled={isLocked || savedProfiles.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition disabled:opacity-50"
          >
            <Search size={16} />
            Load Profile ({savedProfiles.length})
          </button>
          <button
            type="button"
            onClick={handleClearForm}
            disabled={isLocked}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Clear
          </button>
        </div>
        
        {validationError && (
          <div className="bg-red-900/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-lg text-sm">
            {validationError}
          </div>
        )}
        
        <div className="space-y-4 opacity-100 transition-opacity">
          <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Custom ICP Description (Optional)
            </label>
            <textarea
              name="customICP"
              placeholder="e.g., 'Series A SaaS companies in B2B marketing space with 50-200 employees and $5M+ revenue'"
              value={criteria.customICP || ""}
              onChange={(e) => setCriteria((prev) => ({ ...prev, customICP: e.target.value }))}
              className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none min-h-[80px] resize-y"
              rows={3}
              disabled={isLocked}
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe your ideal customer profile in detail, or use the structured fields below
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

        {/* Basic Information Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Basic Information</h3>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Industry / Vertical
              </label>
              <select
                name="industry"
                value={criteria.industry}
                onChange={(e) => setCriteria((prev) => ({ ...prev, industry: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                disabled={isLocked}
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
                disabled={isLocked}
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
                placeholder="e.g. USA, Europe, India, Asia"
                value={criteria.location}
                onChange={(e) => setCriteria((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                disabled={isLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Job Titles <span className="text-xs text-gray-500">(up to 10)</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !isLocked && setShowJobTitles(!showJobTitles)}
                  disabled={isLocked}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-left text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none flex items-center justify-between"
                >
                  {criteria.jobTitles.length > 0
                    ? `${criteria.jobTitles.length} selected`
                    : "Select job titles"}
                  <ChevronDown size={18} />
                </button>
                
                {showJobTitles && !isLocked && (
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
                          onClick={() => !isLocked && handleJobTitleToggle(title)}
                          className="hover:text-orange-300"
                          disabled={isLocked}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Options Section */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center gap-2 text-sm font-semibold text-[#FF6B35] hover:text-orange-400 transition"
          >
            <ChevronDown size={16} className={`transform transition-transform ${showAdvancedOptions ? "rotate-180" : ""}`} />
            Revenue & Funding Options
          </button>
          
          {showAdvancedOptions && (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 ${isLocked ? "opacity-50 pointer-events-none" : ""}`}>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-sm font-medium text-gray-400">
                    Annual Revenue
                  </label>
                  <div className="group relative">
                    <Info size={14} className="text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-xs text-gray-300 rounded-lg border border-gray-700 z-50">
                      Filter leads by company revenue to focus on organizations with specific financial capacity
                    </div>
                  </div>
                </div>
                <select
                  name="annualRevenue"
                  value={criteria.annualRevenue || ""}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, annualRevenue: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  disabled={isLocked}
                >
                  <option value="">Any revenue</option>
                  {revenueOptions.map((revenue) => (
                    <option key={revenue} value={revenue}>{revenue}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-sm font-medium text-gray-400">
                    Funding Stage
                  </label>
                  <div className="group relative">
                    <Info size={14} className="text-gray-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-xs text-gray-300 rounded-lg border border-gray-700 z-50">
                      Target companies based on their funding trajectory (seed, series A, etc.)
                    </div>
                  </div>
                </div>
                <select
                  name="fundingStage"
                  value={criteria.fundingStage || ""}
                  onChange={(e) => setCriteria((prev) => ({ ...prev, fundingStage: e.target.value }))}
                  className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  disabled={isLocked}
                >
                  <option value="">Any stage</option>
                  {fundingOptions.map((funding) => (
                    <option key={funding} value={funding}>{funding}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Quality Score Section (Pro only) */}
        {userPlan === "pro" && (
          <div className={isLocked ? "opacity-50 pointer-events-none" : ""}>
            <div className="flex items-center gap-1 mb-2">
              <label className="block text-sm font-medium text-gray-400">
                Lead Quality Score: {criteria.qualityScore}%
              </label>
              <div className="group relative">
                <Info size={14} className="text-gray-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-xs text-gray-300 rounded-lg border border-gray-700 z-50">
                  Only show leads with a confidence score above this threshold
                </div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={criteria.qualityScore || 70}
              onChange={(e) => setCriteria((prev) => ({ ...prev, qualityScore: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
              disabled={isLocked}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading || isLocked}
          className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin me-2" size={20} />
              Scraping Leads...
            </>
          ) : isLocked ? (
            <>
              <Search className="me-2" size={20} />
              Limit Reached
            </>
          ) : (
            <>
              <Search className="me-2" size={20} />
              Search Leads
            </>
          )}
        </button>
      </form>

      {/* Save Profile Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Save ICP Profile</h3>
            <input
              type="text"
              placeholder="Profile name (e.g., 'SaaS Series A')"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveProfile}
                className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setProfileName("");
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Profile Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl p-6 max-w-2xl w-full border border-gray-800 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Load Saved Profile</h3>
            <div className="space-y-2">
              {savedProfiles.map((profile) => (
                <div key={profile.id} className="bg-black border border-gray-700 rounded-lg p-4 hover:border-[#FF6B35] transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{profile.name}</h4>
                      <div className="text-xs text-gray-400 space-y-1">
                        {profile.industry && <p>Industry: {profile.industry.join(", ")}</p>}
                        {profile.companySize && <p>Size: {profile.companySize.join(", ")}</p>}
                        {profile.location && <p>Location: {profile.location.join(", ")}</p>}
                        <p className="text-gray-500">Used {profile.usageCount} times</p>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleLoadProfile(profile)}
                        className="p-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded transition"
                        title="Use profile"
                      >
                        <Search size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicateProfile(profile.id)}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                        title="Duplicate"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="p-2 bg-red-900 hover:bg-red-800 text-white rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowLoadModal(false)}
              className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedICPForm;
