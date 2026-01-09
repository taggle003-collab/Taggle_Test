"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const AnalyticsCard = ({ title, icon: Icon, children, className }: AnalyticsCardProps) => {
  return (
    <div className={cn(
      "bg-[#2a2a2a] rounded-lg p-6 border border-[#FF6B35]/10 hover:border-[#FF6B35]/20 transition-colors",
      className
    )}>
      <div className="flex items-center mb-4">
        <div className="p-2 bg-[#FF6B35]/10 rounded-lg mr-3">
          <Icon className="w-5 h-5 text-[#FF6B35]" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <div className="text-gray-300">
        {children}
      </div>
    </div>
  );
};

export default AnalyticsCard;