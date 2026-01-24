'use client';

import React, { useState, useEffect } from 'react';

interface CitySelectorProps {
  country?: string;
  value?: string;
  onChange: (city: string) => void;
  className?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({ country, value, onChange, className }) => {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (country) {
      fetchCities(country);
    } else {
      setCities([]);
    }
  }, [country]);

  const fetchCities = async (selectedCountry: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/leads/cities?country=${encodeURIComponent(selectedCountry)}`);
      const result = await response.json();
      
      if (result.success) {
        setCities(result.cities || []);
      } else {
        setError(result.error || 'Failed to fetch cities');
      }
    } catch (err) {
      setError('Failed to fetch cities');
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
        City
      </label>
      <select
        id="city"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || !country}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:opacity-50"
      >
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
      {loading && (
        <div className="mt-1 text-sm text-gray-400">Loading cities...</div>
      )}
      {error && (
        <div className="mt-1 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
};

export default CitySelector;