"use client";

import React, { useState, useEffect } from "react";
import { Save, Check, ChevronDown, ChevronUp, Settings } from "lucide-react";

export interface GlobalICPSettings {
  industries: string[];
  companySize: string;
  revenueRange: string;
  growthStage: string;
  budgetRange: string;
  useCase: string;
  decisionMakers: string;
}

const defaultSettings: GlobalICPSettings = {
  industries: [],
  companySize: "",
  revenueRange: "",
  growthStage: "",
  budgetRange: "",
  useCase: "",
  decisionMakers: "",
};

const INDUSTRY_OPTIONS = [
  "Tech", "SaaS", "Healthcare", "Finance", "E-commerce", "Manufacturing", "Retail", "Education", "Real Estate", "Other"
];

const COMPANY_SIZE_OPTIONS = [
  { value: "startup", label: "Startup (1-50)" },
  { value: "smb", label: "SMB (50-500)" },
  { value: "mid-market", label: "Mid-Market (500-5000)" },
  { value: "enterprise", label: "Enterprise (5000+)" },
];

const REVENUE_OPTIONS = [
  "<$1M", "$1M-$10M", "$10M-$50M", "$50M-$100M", "$100M+"
];

const GROWTH_STAGE_OPTIONS = [
  "Early stage", "Growth", "Scaling", "Mature"
];

interface GlobalICPFormProps {
  onSave?: (settings: GlobalICPSettings) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const GlobalICPForm = ({ onSave, isOpen: externalIsOpen, onToggle: externalOnToggle }: GlobalICPFormProps) => {
  const [settings, setSettings] = useState<GlobalICPSettings>(defaultSettings);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onToggle = externalOnToggle || (() => setInternalIsOpen(!internalIsOpen));

  useEffect(() => {
    const saved = localStorage.getItem("user_icp_preferences");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Defer update to avoid synchronous set state warning
        setTimeout(() => setSettings(parsed), 0);
      } catch (e) {
        console.error("Failed to parse saved ICP settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("user_icp_preferences", JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    if (onSave) onSave(settings);
  };

  const toggleIndustry = (industry: string) => {
    setSettings(prev => {
      const industries = prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry];
      return { ...prev, industries };
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] via-gray-900/20 to-[#1a1a1a] rounded-2xl border border-gray-800 shadow-xl overflow-hidden mb-6">
      <button
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-800/30 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/30">
            <Settings size={20} className="text-[#FF6B35]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-[#FF6B35] transition-colors duration-300">
              Set Ideal Customer Profile (ICP)
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Define your perfect customer to automatically highlight matching leads
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
            {settings.industries.length > 0 && (
                <span className="text-xs text-[#FF6B35] px-3 py-1 bg-[#FF6B35]/10 rounded-full border border-[#FF6B35]/20">
                    Active
                </span>
            )}
          {isOpen ? <ChevronUp size={20} className="text-[#FF6B35]" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-800/60 bg-gradient-to-br from-black/20 to-transparent">
          <div className="mt-6 space-y-6">
            
            {/* Industry Focus */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Industry Focus</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map(industry => (
                  <button
                    key={industry}
                    onClick={() => toggleIndustry(industry)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      settings.industries.includes(industry)
                        ? "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]"
                        : "bg-black text-gray-400 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Company Size Preference</label>
                <div className="space-y-2">
                  {COMPANY_SIZE_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        settings.companySize === option.value
                          ? "border-[#FF6B35]" 
                          : "border-gray-600 group-hover:border-gray-400"
                      }`}>
                        {settings.companySize === option.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                        )}
                      </div>
                      <input
                        type="radio"
                        name="companySize"
                        value={option.value}
                        checked={settings.companySize === option.value}
                        onChange={(e) => setSettings({ ...settings, companySize: e.target.value })}
                        className="hidden"
                      />
                      <span className={`text-sm ${
                        settings.companySize === option.value ? "text-white" : "text-gray-400 group-hover:text-gray-300"
                      }`}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Other Dropdowns */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Annual Revenue Range</label>
                  <select
                    value={settings.revenueRange}
                    onChange={(e) => setSettings({ ...settings, revenueRange: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  >
                    <option value="">Select Revenue Range</option>
                    {REVENUE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Growth Stage</label>
                  <select
                    value={settings.growthStage}
                    onChange={(e) => setSettings({ ...settings, growthStage: e.target.value })}
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  >
                    <option value="">Select Growth Stage</option>
                    {GROWTH_STAGE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Budget Range</label>
                  <input
                    type="text"
                    value={settings.budgetRange}
                    onChange={(e) => setSettings({ ...settings, budgetRange: e.target.value })}
                    placeholder="e.g. $5k-10k/month"
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Text Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Decision Makers</label>
                  <input
                    type="text"
                    value={settings.decisionMakers}
                    onChange={(e) => setSettings({ ...settings, decisionMakers: e.target.value })}
                    placeholder="e.g. CTO, VP of Engineering"
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Job titles or roles you target</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Use Case / Pain Points</label>
                  <textarea
                    value={settings.useCase}
                    onChange={(e) => setSettings({ ...settings, useCase: e.target.value })}
                    placeholder="What problems are they solving?"
                    className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none min-h-[80px] resize-y"
                    rows={3}
                  />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-800/60">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
                    isSaved 
                    ? "bg-green-600 text-white"
                    : "bg-[#FF6B35] hover:bg-[#e55a2b] text-white shadow-lg shadow-[#FF6B35]/20 hover:shadow-[#FF6B35]/40"
                }`}
              >
                {isSaved ? <Check size={20} /> : <Save size={20} />}
                {isSaved ? "Saved!" : "Save ICP Criteria"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalICPForm;
