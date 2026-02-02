'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Mail, Globe, Building, Award } from 'lucide-react';
import { generateLeadInsights } from '@/lib/lead-insights';
import type { SoloLeadInsights, ProLeadInsights } from '@/lib/lead-insights';
import { Lead, LeadSearchResult } from '@/lib/lead-types';

interface LeadsAnalyticsProps {
  leads: (Lead | LeadSearchResult)[];
  userPlan: 'solo' | 'pro';
}

export function LeadsAnalytics({ leads, userPlan }: LeadsAnalyticsProps) {
  const [insights, setInsights] = useState<SoloLeadInsights | ProLeadInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const generatedInsights = generateLeadInsights(leads, userPlan);
    setInsights(generatedInsights);
    setLoading(false);
  }, [leads, userPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Generating insights...</div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-8 text-center">
        <BarChart3 size={48} className="text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No insights available</h3>
        <p className="text-gray-400">Add some leads to see analytics and insights.</p>
      </div>
    );
  }

  const isPro = userPlan === 'pro';
  const proInsights = isPro ? (insights as ProLeadInsights) : null;

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-blue-400" size={24} />}
          label="Total Leads"
          value={insights.totalLeads.toString()}
        />
        <StatCard
          icon={<Mail className="text-green-400" size={24} />}
          label="Contact Rate"
          value={`${insights.emailContactRate}%`}
          trend="+12%"
        />
        <StatCard
          icon={<Globe className="text-purple-400" size={24} />}
          label="With Website"
          value={`${insights.websiteAvailability}%`}
        />
        <StatCard
          icon={<Award className="text-orange-400" size={24} />}
          label="Avg Lead Score"
          value={`${insights.averageLeadScore}/100`}
        />
      </div>

      {/* Detailed Insights */}
      {isPro && proInsights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Score Distribution */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Quality Distribution</h3>
            <div className="space-y-3">
              <QualityBar 
                label="Excellent (81-100)"
                value={proInsights.leadScoreDistribution.excellent}
                total={insights.totalLeads}
                color="bg-green-500"
              />
              <QualityBar 
                label="Good (61-80)"
                value={proInsights.leadScoreDistribution.good}
                total={insights.totalLeads}
                color="bg-blue-500"
              />
              <QualityBar 
                label="Average (41-60)"
                value={proInsights.leadScoreDistribution.average}
                total={insights.totalLeads}
                color="bg-yellow-500"
              />
              <QualityBar 
                label="Poor (0-40)"
                value={proInsights.leadScoreDistribution.poor}
                total={insights.totalLeads}
                color="bg-red-500"
              />
            </div>
          </div>

          {/* Company Size Distribution */}
          <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Company Size Distribution</h3>
            <div className="space-y-3">
              <QualityBar 
                label="Small (1-50)"
                value={proInsights.companySizeEstimation.small}
                total={insights.totalLeads}
                color="bg-purple-500"
              />
              <QualityBar 
                label="Medium (51-500)"
                value={proInsights.companySizeEstimation.medium}
                total={insights.totalLeads}
                color="bg-indigo-500"
              />
              <QualityBar 
                label="Large (500+)"
                value={proInsights.companySizeEstimation.large}
                total={insights.totalLeads}
                color="bg-pink-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Industry & Country Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Industries */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building size={20} className="text-[#FF6B35]" />
            Top Industries
          </h3>
          <div className="space-y-3">
            {insights.topIndustries.slice(0, 5).map((industry, index) => (
              <div key={industry.industry} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-white font-medium">{industry.industry}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B35] font-bold">{industry.count}</span>
                  <span className="text-xs text-gray-400">({industry.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
          
          {isPro && proInsights && proInsights.industryTrends.emerging.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <span className="text-xs text-green-400 font-medium">Emerging Trends:</span>
              <div className="text-xs text-gray-300 mt-1">
                {proInsights.industryTrends.emerging.join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-[#FF6B35]" />
            Top Countries
          </h3>
          <div className="space-y-3">
            {insights.topCountries.slice(0, 5).map((country, index) => (
              <div key={country.country} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-white font-medium">{country.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B35] font-bold">{country.count}</span>
                  <span className="text-xs text-gray-400">({country.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pro-Only Advanced Analytics */}
      {isPro && proInsights && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Advanced Pro Analytics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tech Stack Analysis */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tech Stack</h3>
              <div className="space-y-2">
                <StatRow label="WordPress" value={proInsights.techStackDetection.wordpress} />
                <StatRow label="Shopify" value={proInsights.techStackDetection.shopify} />
                <StatRow label="Custom" value={proInsights.techStackDetection.custom} />
                <StatRow label="Unknown" value={proInsights.techStackDetection.unknown} />
              </div>
            </div>

            {/* Social Media Reach */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Social Media</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-[#FF6B35]">
                  {formatNumber(proInsights.socialMediaMetrics.totalReach)}
                </div>
                <div className="text-xs text-gray-400">Total Reach</div>
              </div>
              <div className="space-y-2">
                <StatRow 
                  label="Activity Score" 
                  value={`${proInsights.socialMediaMetrics.averageActivity}%`} 
                />
              </div>
            </div>

            {/* Growth Potential */}
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Growth Potential</h3>
              <div className="space-y-2">
                <StatRow 
                  label="High" 
                  value={proInsights.growthPotential.high} 
                  color="text-green-400" 
                />
                <StatRow 
                  label="Medium" 
                  value={proInsights.growthPotential.medium} 
                  color="text-yellow-400" 
                />
                <StatRow 
                  label="Low" 
                  value={proInsights.growthPotential.low} 
                  color="text-red-400" 
                />
              </div>
            </div>
          </div>

          {/* Competitive Insights */}
          {proInsights.competitiveInsights.keyCompetitors.length > 0 && (
            <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Competitive Landscape</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Market Concentration</span>
                    <span className="text-white font-medium capitalize">
                      {proInsights.competitiveInsights.marketConcentration}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Competitors</span>
                    <span className="text-[#FF6B35] font-bold">
                      {proInsights.competitiveInsights.totalCompetitors}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white mb-2">Key Competitors</div>
                  <div className="flex flex-wrap gap-2">
                    {proInsights.competitiveInsights.keyCompetitors.map((competitor, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
                      >
                        {competitor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  trend?: string;
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6 hover:border-[#FF6B35]/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        {icon}
        {trend && (
          <span className="text-xs text-green-400 font-medium flex items-center gap-1">
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function QualityBar({ 
  label, 
  value, 
  total, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number; 
  color: string; 
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm text-[#FF6B35] font-medium">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatRow({ label, value, color = 'text-white' }: { 
  label: string; 
  value: string | number; 
  color?: string; 
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
