"use client";

import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";

export interface ICPCriteria {
  industry: string;
  companySize: string;
  location: string;
  jobTitles: string;
}

interface ICPFormProps {
  onScrape: (criteria: ICPCriteria) => void;
  isLoading: boolean;
}

const ICPForm = ({ onScrape, isLoading }: ICPFormProps) => {
  const [criteria, setCriteria] = useState<ICPCriteria>({
    industry: "",
    companySize: "",
    location: "",
    jobTitles: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCriteria((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onScrape(criteria);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-xl border border-gray-800 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Industry / Vertical
          </label>
          <input
            type="text"
            name="industry"
            placeholder="e.g. SaaS, Healthcare"
            value={criteria.industry}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Company Size
          </label>
          <select
            name="companySize"
            value={criteria.companySize}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none"
            required
          >
            <option value="">Select size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
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
            placeholder="e.g. USA, Europe"
            value={criteria.location}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Job Titles
          </label>
          <input
            type="text"
            name="jobTitles"
            placeholder="e.g. CEO, CTO, Founder"
            value={criteria.jobTitles}
            onChange={handleChange}
            className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white focus:border-orange-600 focus:ring-1 focus:ring-orange-600 outline-none"
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin me-2" size={20} />
            Scraping Leads...
          </>
        ) : (
          <>
            <Search className="me-2" size={20} />
            Start Scraping
          </>
        )}
      </button>
    </form>
  );
};

export default ICPForm;
