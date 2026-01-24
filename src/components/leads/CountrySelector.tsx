"use client";

import { useEffect, useState } from "react";

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CountrySelector({ value, onChange }: CountrySelectorProps) {
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/leads/countries");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch countries");
      }

      if (data.success) {
        setCountries(data.countries || []);
      } else {
        throw new Error(data.error || "Failed to fetch countries");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error fetching countries:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Error loading countries: {error}
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Country
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-4 py-2 bg-[#2a2a2a] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FF6B35] disabled:opacity-50"
      >
        <option value="">
          {loading ? "Loading countries..." : "All Countries"}
        </option>
        {countries.map((country) => (
          <option key={country} value={country}>
            {country}
          </option>
        ))}
      </select>
    </div>
  );
}
