import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface LeadFilterBarProps {
  country: string;
  setCountry: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
  totalCount?: number;
}

const LeadFilterBar: React.FC<LeadFilterBarProps> = ({
  country,
  setCountry,
  category,
  setCategory,
  onSearch,
  isLoading,
  totalCount
}) => {
  return (
    <div className="bg-[#111111] border border-[#333] rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full bg-[#222] border border-[#333] text-white rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="USA">USA</option>
            <option value="India">India</option>
            {/* Future: UK, etc. */}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#222] border border-[#333] text-white rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="Tech">Tech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
          </select>
        </div>

        <div className="w-full md:w-auto">
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Search size={20} />
            )}
            Search
          </button>
        </div>
      </div>
      
      {totalCount !== undefined && (
        <div className="mt-4 text-sm text-gray-400">
          Found {totalCount} leads for <span className="text-white font-medium">{category}</span> in <span className="text-white font-medium">{country}</span>
        </div>
      )}
    </div>
  );
};

export default LeadFilterBar;
