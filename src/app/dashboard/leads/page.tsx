'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, Database } from 'lucide-react';
import CountrySelector from '@/components/leads/CountrySelector';
import CitySelector from '@/components/leads/CitySelector';
import LeadsTable from '@/components/leads/LeadsTable';
import EmptyState from '@/components/leads/EmptyState';
import { Lead } from '@/lib/supabase-client';

const MyLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [businessType, setBusinessType] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async (filters?: { country?: string; city?: string; businessType?: string }) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters?.country) params.append('country', filters.country);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.businessType) params.append('businessType', filters.businessType);

      const response = await fetch(`/api/leads?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setLeads(result.data || []);
        setTotalCount(result.count || 0);
      } else {
        setError(result.error || 'Failed to fetch leads');
      }
    } catch (err) {
      setError('Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    await fetchLeads({
      country: selectedCountry || undefined,
      city: selectedCity || undefined,
      businessType: businessType || undefined,
    });
    setSearching(false);
  };

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedCity(''); // Reset city when country changes
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };

  const handleClearFilters = () => {
    setSelectedCountry('');
    setSelectedCity('');
    setBusinessType('');
    fetchLeads();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">My Leads</h1>
        <p className="text-gray-400">
          View and manage your imported leads from the database.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-[#FF6B35]" size={20} />
          <h2 className="text-lg font-semibold text-white">Search & Filter</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <CountrySelector
            value={selectedCountry}
            onChange={handleCountryChange}
          />
          
          <CitySelector
            country={selectedCountry}
            value={selectedCity}
            onChange={handleCityChange}
          />
          
          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-300 mb-2">
              Business Type
            </label>
            <input
              type="text"
              id="businessType"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              placeholder="e.g., SaaS, E-commerce"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {searching ? 'Searching...' : 'Search'}
          </button>
          
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="text-[#FF6B35]" size={20} />
            <h2 className="text-lg font-semibold text-white">Database Leads</h2>
          </div>
          {totalCount > 0 && (
            <p className="text-gray-400 text-sm">
              Showing {leads.length} of {totalCount} leads
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 text-red-400">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-gray-900 rounded-lg p-8 text-center">
            <Loader2 className="mx-auto mb-4 text-[#FF6B35] animate-spin" size={32} />
            <p className="text-gray-400">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <EmptyState />
        ) : (
          <LeadsTable leads={leads} />
        )}
      </div>
    </div>
  );
};

export default MyLeadsPage;