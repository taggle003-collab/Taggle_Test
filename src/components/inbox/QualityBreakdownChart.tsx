'use client';

import { LimitedInsights, FullInsights } from '@/lib/inbox-types';

interface QualityBreakdownChartProps {
  insights: LimitedInsights | FullInsights;
}

export function QualityBreakdownChart({ insights }: QualityBreakdownChartProps) {
  const { qualityBreakdown } = insights;
  const total = qualityBreakdown.verified + qualityBreakdown.highQuality + qualityBreakdown.mediumQuality + qualityBreakdown.lowQuality;
  
  const getPercentage = (count: number) => Math.round((count / total) * 100);
  
  const breakdownData = [
    { 
      label: 'High Quality (80%+)', 
      count: qualityBreakdown.highQuality, 
      percentage: getPercentage(qualityBreakdown.highQuality),
      color: '#22c55e' // Green
    },
    { 
      label: 'Medium Quality (60-79%)', 
      count: qualityBreakdown.mediumQuality, 
      percentage: getPercentage(qualityBreakdown.mediumQuality),
      color: '#eab308' // Yellow
    },
    { 
      label: 'Low Quality (<60%)', 
      count: qualityBreakdown.lowQuality, 
      percentage: getPercentage(qualityBreakdown.lowQuality),
      color: '#6b7280' // Gray
    },
  ];

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quality Breakdown</h3>
      
      <div className="space-y-3">
        {breakdownData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-white">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-white">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${item.percentage}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Total Verified</span>
          <span className="text-sm font-medium text-[#FF6B35]">
            {qualityBreakdown.verified} verified
          </span>
        </div>
      </div>
    </div>
  );
}