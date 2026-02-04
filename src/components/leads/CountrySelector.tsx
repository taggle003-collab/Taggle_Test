'use client';

import React, { useState, useEffect } from 'react';

interface CountrySelectorProps {
  value?: string;
  onChange: (country: string) => void;
  className?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange, className }) => {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads/countries');
      const result = await response.json();
      
      if (result.success) {
        setCountries(result.countries || []);
      } else {
        setError(result.error || 'Failed to fetch countries');
      }
    } catch (err) {
      setError('Failed to fetch countries');
      console.error('Error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
        Country
      </label>
      <select
        id="country"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent disabled:opacity-50"
      >
        <option value="">All Countries</option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
      {loading && (
        <div className="mt-1 text-sm text-gray-400">Loading countries...</div>
      )}
      {error && (
        <div className="mt-1 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
};

export default CountrySelector;