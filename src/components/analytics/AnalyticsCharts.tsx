"use client";

import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// Industry Distribution Chart
const IndustryChart = ({ data }: { data: { industry: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(item => item.count));
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.industry} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{item.industry}</span>
            <span className="text-[#FF6B35] font-medium">{item.count}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Company Size Distribution Chart
const CompanySizeChart = ({ data }: { data: { size: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(item => item.count));
  
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.size} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{item.size} employees</span>
            <span className="text-[#FF6B35] font-medium">{item.count}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[#FF6B35] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Location Distribution Chart
const LocationChart = ({ data }: { data: { location: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(item => item.count));
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((item) => (
        <div key={item.location} className="bg-[#1a1a1a] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-[#FF6B35] mb-1">{item.count}</div>
          <div className="text-gray-400 text-sm">{item.location}</div>
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
            <div
              className="bg-[#FF6B35] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Status Chart for Pipeline
const StatusChart = ({ data }: { data: { status: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(item => item.count));
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const statusColors = {
    "New": "bg-blue-500",
    "Contacted": "bg-yellow-500",
    "Interested": "bg-orange-500",
    "Negotiating": "bg-purple-500",
    "Won": "bg-green-500",
    "Lost": "bg-red-500"
  };
  
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.status} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">{item.status}</span>
            <span className="text-white font-medium">
              {item.count} ({Math.round((item.count / total) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`${statusColors[item.status as keyof typeof statusColors] || "bg-[#FF6B35]"} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Conversion Funnel Chart
const ConversionFunnel = ({ data }: { data: { stage: string; rate: number }[] }) => {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={item.stage} className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-300">{item.stage}</span>
            <span className="text-sm text-[#FF6B35] font-medium">{item.rate}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-lg h-8 flex items-center">
              <div
                className="bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium transition-all duration-500"
                style={{ width: `${item.rate}%` }}
              >
                {item.rate}%
              </div>
            </div>
            {index < data.length - 1 && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2">
                <div className="w-0 h-0 border-l-4 border-l-[#FF6B35] border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Industry Performance Chart (ROI + Conversion Rate)
const IndustryPerformanceChart = ({ data }: { data: { industry: string; roi: number; conversionRate: number }[] }) => {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.industry} className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">{item.industry}</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-green-400 text-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                {item.roi}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-2">Conversion Rate: {item.conversionRate}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(item.roi / 5, 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Company Size Performance Chart
const CompanySizePerformanceChart = ({ data }: { data: { size: string; roi: number; conversionRate: number }[] }) => {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.size} className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">{item.size} employees</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-green-400 text-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                {item.roi}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-400 mb-2">Conversion Rate: {item.conversionRate}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#FF6B35] to-[#e55a2b] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(item.roi / 5, 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsCharts = {
  IndustryChart,
  CompanySizeChart,
  LocationChart,
  StatusChart,
  ConversionFunnel,
  IndustryPerformanceChart,
  CompanySizePerformanceChart
};

export default AnalyticsCharts;