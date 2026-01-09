"use client";

import React, { useState, useEffect } from "react";
import { getLeadsLimit, getFeatureLevel } from "@/lib/feature-access";
import AnalyticsCard from "./AnalyticsCard";
import AnalyticsCharts from "./AnalyticsCharts";
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users, 
  Mail, 
  Download,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { AnalyticsData } from "./types";

interface LimitedAnalyticsProps {
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

const LimitedAnalytics = ({ userPlan, userEmail }: LimitedAnalyticsProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const leadsLimit = getLeadsLimit(userPlan, userEmail);

  useEffect(() => {
    // Simulate API call with mock data
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Mock analytics data
      const mockData: AnalyticsData = {
        totalLeadsScrapped: 250,
        leadsRemaining: leadsLimit - 250,
        industryDistribution: [
          { industry: "SaaS", count: 85 },
          { industry: "Healthcare", count: 45 },
          { industry: "Finance", count: 38 },
          { industry: "Manufacturing", count: 32 },
          { industry: "Retail", count: 25 },
          { industry: "Tech", count: 25 }
        ],
        companySizeDistribution: [
          { size: "1-10", count: 60 },
          { size: "10-50", count: 85 },
          { size: "50-100", count: 55 },
          { size: "100-500", count: 35 },
          { size: "500-1000", count: 15 }
        ],
        locationDistribution: [
          { location: "USA", count: 120 },
          { location: "UK", count: 45 },
          { location: "Canada", count: 35 },
          { location: "Australia", count: 25 },
          { location: "Germany", count: 25 }
        ],
        verificationRate: 94,
        averageAccuracyScore: 87,
        verifiedLeads: 235,
        unverifiedLeads: 15,
        campaignCount: 5,
        averageLeadsPerCampaign: 50,
        topCampaign: {
          name: "SaaS Founders Q1",
          leadCount: 75,
          icp: "SaaS companies, 10-50 employees, USA/UK"
        }
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, [leadsLimit]);

  const exportToCSV = () => {
    if (!analyticsData) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Leads Scrapped", analyticsData.totalLeadsScrapped.toString()],
      ["Leads Remaining", analyticsData.leadsRemaining.toString()],
      ["Verification Rate", `${analyticsData.verificationRate}%`],
      ["Average Accuracy Score", `${analyticsData.averageAccuracyScore}%`],
      ["Verified Leads", analyticsData.verifiedLeads.toString()],
      ["Unverified Leads", analyticsData.unverifiedLeads.toString()],
      ["Campaign Count", analyticsData.campaignCount.toString()],
      ["Average Leads Per Campaign", analyticsData.averageLeadsPerCampaign.toString()]
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taggle-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const emailReport = () => {
    // In a real implementation, this would trigger an email API call
    alert("Analytics report will be sent to your email address!");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#2a2a2a] rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Lead Scraping Stats */}
      <AnalyticsCard
        title="Lead Scraping Stats"
        icon={Target}
        className="col-span-full"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Monthly Quota Usage</span>
            <span className="text-2xl font-bold text-[#FF6B35]">
              {analyticsData.totalLeadsScrapped} / {leadsLimit}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-[#FF6B35] h-3 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((analyticsData.totalLeadsScrapped / leadsLimit) * 100, 100)}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{analyticsData.leadsRemaining} remaining</span>
            <span>{Math.round((analyticsData.totalLeadsScrapped / leadsLimit) * 100)}% used</span>
          </div>
        </div>
      </AnalyticsCard>

      {/* ICP Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard title="Industry Distribution" icon={BarChart3}>
          <AnalyticsCharts.IndustryChart data={analyticsData.industryDistribution} />
        </AnalyticsCard>
        
        <AnalyticsCard title="Company Size Distribution" icon={Users}>
          <AnalyticsCharts.CompanySizeChart data={analyticsData.companySizeDistribution} />
        </AnalyticsCard>
      </div>

      {/* Location Distribution */}
      <AnalyticsCard title="Location Distribution" icon={TrendingUp}>
        <AnalyticsCharts.LocationChart data={analyticsData.locationDistribution} />
      </AnalyticsCard>

      {/* Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnalyticsCard title="Email Verification Rate" icon={CheckCircle}>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {analyticsData.verificationRate}%
            </div>
            <p className="text-gray-400 text-sm">Verified emails</p>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Average Accuracy" icon={Target}>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FF6B35] mb-2">
              {analyticsData.averageAccuracyScore}%
            </div>
            <p className="text-gray-400 text-sm">Quality score</p>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Verified vs Unverified" icon={Users}>
          <div className="text-center">
            <div className="flex justify-center space-x-4 mb-2">
              <div>
                <div className="text-lg font-bold text-green-400">
                  {analyticsData.verifiedLeads}
                </div>
                <p className="text-xs text-gray-400">Verified</p>
              </div>
              <div>
                <div className="text-lg font-bold text-red-400">
                  {analyticsData.unverifiedLeads}
                </div>
                <p className="text-xs text-gray-400">Unverified</p>
              </div>
            </div>
          </div>
        </AnalyticsCard>
      </div>

      {/* Campaign Performance */}
      <AnalyticsCard title="Campaign Performance" icon={TrendingUp}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6B35] mb-1">
              {analyticsData.campaignCount}
            </div>
            <p className="text-gray-400 text-sm">Total Campaigns</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6B35] mb-1">
              {analyticsData.averageLeadsPerCampaign}
            </div>
            <p className="text-gray-400 text-sm">Avg Leads/Campaign</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white mb-1">
              {analyticsData.topCampaign?.name || "N/A"}
            </div>
            <p className="text-gray-400 text-sm">Best Campaign</p>
            {analyticsData.topCampaign && (
              <p className="text-xs text-[#FF6B35] mt-1">
                {analyticsData.topCampaign.leadCount} leads
              </p>
            )}
          </div>
        </div>
      </AnalyticsCard>

      {/* Export Options */}
      <AnalyticsCard title="Export Options" icon={Download}>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={exportToCSV}
            className="flex items-center justify-center px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export as CSV
          </button>
          <button
            onClick={emailReport}
            className="flex items-center justify-center px-4 py-2 border border-[#FF6B35] text-[#FF6B35] rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Email Report
          </button>
        </div>
      </AnalyticsCard>
    </div>
  );
};

export default LimitedAnalytics;