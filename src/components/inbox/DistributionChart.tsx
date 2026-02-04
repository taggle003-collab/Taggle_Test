'use client';

import { useState } from 'react';

interface DistributionChartProps {
  title: string;
  data: { [key: string]: any }[];
  type: 'pie' | 'bar' | 'horizontal-bar';
  onSliceClick?: (value: string) => void;
  onBarClick?: (value: string) => void;
}

export function DistributionChart({ 
  title, 
  data, 
  type = 'pie',
  onSliceClick,
  onBarClick
}: DistributionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = [
    '#FF6B35', '#FF8A5C', '#FFAC8A', '#FFB6A1', '#FFCFB8',
    '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6',
    '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',
  ];
  
  if (type === 'pie') {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {data.length > 0 && data
                .filter(item => item.count > 0)
                .map((item, index) => {
                  const startAngle = data
                    .slice(0, index)
                    .reduce((sum, d) => sum + (d.count / total) * 360, 0);
                  const endAngle = startAngle + (item.count / total) * 360;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
                  
                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={colors[index % colors.length]}
                      stroke={hoveredIndex === index ? '#ffffff' : 'none'}
                      strokeWidth={hoveredIndex === index ? 2 : 1}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => onSliceClick && onSliceClick(item.industry || item.size || item.title || item.stage)}
                    />
                  );
                })}
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs text-gray-400">Total</div>
                <div className="text-lg font-bold text-white">{total}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
          {data.map((item, index) => (
            <div 
              key={index}
              className="flex justify-between items-center text-xs hover:bg-gray-800 p-1 rounded cursor-pointer"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-gray-300">
                  {item.industry || item.stage || item.range || item.title || `Item ${index + 1}`}
                </span>
              </div>
              <div className="text-white">
                {item.count} ({Math.round((item.count / total) * 100)}%)
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (type === 'bar') {
    const maxCount = Math.max(...data.map(item => item.count), 1);
    
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            const isHovered = hoveredIndex === index;
            
            return (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-300">
                    {item.industry || item.size || item.range || `Item ${index + 1}`}
                  </span>
                  <span className="text-sm text-white">
                    {item.count}
                  </span>
                </div>
                <div 
                  className="w-full bg-gray-700 rounded-full h-3 cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onBarClick && onBarClick(item.industry || item.size || item.range || `Item ${index + 1}`)}
                >
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: colors[index % colors.length],
                      transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                      transformOrigin: 'left '
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  if (type === 'horizontal-bar') {
    const maxCount = Math.max(...data.map(item => item.count), 1);
    
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        
        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            
            return (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-32 text-sm text-gray-300 truncate"
                  title={item.title || `Item ${index + 1}`}
                >
                  {item.title || `Item ${index + 1}`}
                </div>
                <div 
                  className="flex-1 bg-gray-700 rounded-full h-3 cursor-pointer"
                  onClick={() => onBarClick && onBarClick(item.title || `Item ${index + 1}`)}
                >
                  <div 
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: colors[index % colors.length]
                    }}
                  />
                </div>
                <div className="w-12 text-right text-sm text-white">
                  {item.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return null;
}