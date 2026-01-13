"use client";

import React, { useState, useEffect } from "react";
import { getFeatureLevel } from "@/lib/feature-access";
import AnalyticsCard from "./AnalyticsCard";
import AnalyticsCharts from "./AnalyticsCharts";
import LimitedAnalytics from "./LimitedAnalytics";
import { 
  BarChart3, 
  Target, 
  TrendingUp, 
  Users, 
  Mail, 
  Download,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Award,
  ArrowUpRight,
  Filter,
  Clock
} from "lucide-react";
import { ExtendedAnalyticsData } from "./types";

interface FullAnalyticsProps {
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

type DateRange = "thisMonth" | "last30" | "last90" | "custom";

const FullAnalytics = ({ userPlan, userEmail }: FullAnalyticsProps) => {
  const [analyticsData, setAnalyticsData] = useState<ExtendedAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>("thisMonth");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Extended mock data for Pro features
      const mockData: ExtendedAnalyticsData = {
        totalLeadsScrapped: 850,
        leadsRemaining: 0,
        industryDistribution: [
          { industry: "SaaS", count: 250 },
          { industry: "Healthcare", count: 180 },
          { industry: "Finance", count: 150 },
          { industry: "Manufacturing", count: 120 },
          { industry: "Retail", count: 100 },
          { industry: "Tech", count: 50 }
        ],
        companySizeDistribution: [
          { size: "1-10", count: 200 },
          { size: "10-50", count: 280 },
          { size: "50-100", count: 180 },
          { size: "100-500", count: 120 },
          { size: "500-1000", count: 50 },
          { size: "1000+", count: 20 }
        ],
        locationDistribution: [
          { location: "USA", count: 400 },
          { location: "UK", count: 150 },
          { location: "Canada", count: 120 },
          { location: "Australia", count: 80 },
          { location: "Germany", count: 60 },
          { location: "Other", count: 40 }
        ],
        verificationRate: 96,
        averageAccuracyScore: 91,
        verifiedLeads: 816,
        unverifiedLeads: 34,
        campaignCount: 18,
        averageLeadsPerCampaign: 47,
        topCampaign: {
          name: "Enterprise SaaS Q1",
          leadCount: 120,
          icp: "Enterprise SaaS, 100+ employees, USA/UK"
        },
        leadsByStatus: [
          { status: "New", count: 320 },
          { status: "Contacted", count: 280 },
          { status: "Interested", count: 150 },
          { status: "Negotiating", count: 65 },
          { status: "Won", count: 25 },
          { status: "Lost", count: 10 }
        ],
        conversionRates: [
          { stage: "Contacted", rate: 87.5 },
          { stage: "Interested", rate: 53.6 },
          { stage: "Negotiating", rate: 43.3 },
          { stage: "Won", rate: 38.5 }
        ],
        averageTimeToConversion: 14.5, // days
        estimatedDealValue: 285000,
        roi: 312,
        industryPerformance: [
          { industry: "SaaS", roi: 385, conversionRate: 45.2 },
          { industry: "Finance", roi: 298, conversionRate: 38.7 },
          { industry: "Healthcare", roi: 267, conversionRate: 35.1 },
          { industry: "Manufacturing", roi: 234, conversionRate: 29.8 },
          { industry: "Retail", roi: 198, conversionRate: 25.3 }
        ],
        companySizePerformance: [
          { size: "100-500", roi: 425, conversionRate: 52.3 },
          { size: "50-100", roi: 378, conversionRate: 47.8 },
          { size: "10-50", roi: 312, conversionRate: 41.2 },
          { size: "500-1000", roi: 289, conversionRate: 38.9 },
          { size: "1-10", roi: 245, conversionRate: 32.1 }
        ]
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, []);

  const exportAdvancedCSV = () => {
    if (!analyticsData) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Leads Scrapped", analyticsData.totalLeadsScrapped.toString()],
      ["Leads Remaining", analyticsData.leadsRemaining.toString()],
      ["Verification Rate", `${analyticsData.verificationRate}%`],
      ["Average Accuracy Score", `${analyticsData.averageAccuracyScore}%`],
      ["ROI", `${analyticsData.roi}%`],
      ["Estimated Deal Value", `$${analyticsData.estimatedDealValue.toLocaleString()}`],
      ["Average Time to Conversion", `${analyticsData.averageTimeToConversion} days`],
      ["", ""],
      ["Industry Performance"],
      ["Industry", "ROI", "Conversion Rate"],
      ...analyticsData.industryPerformance.map(item => [
        item.industry,
        `${item.roi}%`,
        `${item.conversionRate}%`
      ]),
      ["", ""],
      ["Company Size Performance"],
      ["Size", "ROI", "Conversion Rate"],
      ...analyticsData.companySizePerformance.map(item => [
        item.size,
        `${item.roi}%`,
        `${item.conversionRate}%`
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taggle-advanced-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const emailDetailedReport = () => {
    alert("Detailed analytics report will be sent to your email address!");
  };

  const scheduleWeeklyEmail = () => {
    alert("Weekly analytics email scheduled! You'll receive reports every Monday.");
  };

  const getDateRangeLabel = (range: DateRange) => {
    switch (range) {
      case "thisMonth": return "This Month";
      case "last30": return "Last 30 Days";
      case "last90": return "Last 90 Days";
      case "custom": return "Custom Range";
      default: return "This Month";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#2a2a2a] rounded-lg p-6">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#2a2a2a] rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
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
      {/* Date Range Selector */}
      <AnalyticsCard title="Date Range Filter" icon={Calendar} className="col-span-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap gap-2">
            {(["thisMonth", "last30", "last90"] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedDateRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDateRange === range
                    ? "bg-[#FF6B35] text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {getDateRangeLabel(range)}
              </button>
            ))}
          </div>
          {selectedDateRange === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600"
              />
              <span className="text-gray-400 self-center">to</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600"
              />
            </div>
          )}
          <div className="text-sm text-gray-400">
            Showing data for: <span className="text-[#FF6B35] font-medium">{getDateRangeLabel(selectedDateRange)}</span>
          </div>
        </div>
      </AnalyticsCard>

      {/* ROI & Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard title="Return on Investment" icon={DollarSign}>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {analyticsData.roi}%
            </div>
            <div className="flex items-center justify-center text-sm text-green-400">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              +12% vs last month
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Estimated Deal Value" icon={Award}>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FF6B35] mb-2">
              ${analyticsData.estimatedDealValue.toLocaleString()}
            </div>
            <p className="text-gray-400 text-sm">Pipeline value</p>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Avg. Time to Convert" icon={Clock}>
          <div className="text-center">
            <div className="text-3xl font-bold text-[#FF6B35] mb-2">
              {analyticsData.averageTimeToConversion}
            </div>
            <p className="text-gray-400 text-sm">days</p>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Lead Quality Score" icon={Target}>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {analyticsData.averageAccuracyScore}%
            </div>
            <p className="text-gray-400 text-sm">Accuracy rating</p>
          </div>
        </AnalyticsCard>
      </div>

      {/* Include Limited Analytics */}
      <LimitedAnalytics userPlan={userPlan} userEmail={userEmail} />

      {/* Pipeline Analytics */}
      <AnalyticsCard title="Pipeline Analytics" icon={BarChart3} className="col-span-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Leads by Status</h4>
            <AnalyticsCharts.StatusChart data={analyticsData.leadsByStatus} />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h4>
            <AnalyticsCharts.ConversionFunnel data={analyticsData.conversionRates} />
          </div>
        </div>
      </AnalyticsCard>

      {/* Industry & Company Size Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard title="Industry Performance Ranking" icon={TrendingUp}>
          <AnalyticsCharts.IndustryPerformanceChart data={analyticsData.industryPerformance} />
        </AnalyticsCard>
        
        <AnalyticsCard title="Company Size Effectiveness" icon={Users}>
          <AnalyticsCharts.CompanySizePerformanceChart data={analyticsData.companySizePerformance} />
        </AnalyticsCard>
      </div>

      {/* Advanced Export Options */}
      <AnalyticsCard title="Advanced Export & Reporting" icon={Download}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={exportAdvancedCSV}
              className="flex items-center justify-center px-4 py-3 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Advanced CSV
            </button>
            <button
              onClick={emailDetailedReport}
              className="flex items-center justify-center px-4 py-3 border border-[#FF6B35] text-[#FF6B35] rounded-lg hover:bg-[#FF6B35] hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Detailed Report
            </button>
            <button
              onClick={scheduleWeeklyEmail}
              className="flex items-center justify-center px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Weekly Email
            </button>
          </div>
          <div className="text-sm text-gray-400">
            <p>• Advanced CSV includes ROI metrics, conversion rates, and performance rankings</p>
            <p>• Detailed reports include trend analysis and actionable insights</p>
            <p>• Weekly emails provide automated performance summaries</p>
          </div>
        </div>
      </AnalyticsCard>
    </div>
  );
};

export default FullAnalytics;