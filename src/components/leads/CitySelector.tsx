"use client";

import { useEffect, useState } from "react";

interface CitySelectorProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
}

export default function CitySelector({ country, value, onChange }: CitySelectorProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (country) {
      fetchCities(country);
    } else {
      setCities([]);
      onChange("");
    }
  }, [country]);

  const fetchCities = async (selectedCountry: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/leads/cities?country=${encodeURIComponent(selectedCountry)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch cities");
      }

      if (data.success) {
        setCities(data.cities || []);
      } else {
        throw new Error(data.error || "Failed to fetch cities");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching cities:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!country) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          City
        </label>
        <select
          value=""
          disabled
          className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white opacity-50"
        >
          <option>Select a country first</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Error loading cities: {error}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FF6B35] disabled:opacity-50"
      >
        <option value="">
          {loading ? "Loading cities..." : "All Cities"}
        </option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
}
