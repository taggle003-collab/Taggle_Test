"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutomationCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  locked?: boolean;
  badge?: string;
  isActive?: boolean;
  onToggleActive?: (next: boolean) => void;
  toggleDisabled?: boolean;
}

const AutomationCard = ({
  title,
  description,
  icon: Icon,
  href,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
  locked,
  badge,
  isActive,
  onToggleActive,
  toggleDisabled,
}: AutomationCardProps) => {
  return (
    <div
      className={cn(
        "p-6 bg-black rounded-lg border transition-colors",
        locked ? "border-gray-800" : "border-[#FF6B35]/20 hover:border-[#FF6B35]/40"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "p-3 rounded-lg",
              locked ? "bg-gray-900 text-gray-500" : "bg-[#FF6B35]/10 text-[#FF6B35]"
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white text-lg font-semibold">{title}</h3>
              {badge && (
                <span className="text-xs px-2 py-1 rounded bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20">
                  {badge}
                </span>
              )}
              {locked && <Lock className="w-4 h-4 text-gray-500" />}
            </div>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          </div>
        </div>

        {typeof isActive === "boolean" && onToggleActive && (
          <button
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => onToggleActive(!isActive)}
            disabled={toggleDisabled}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              isActive ? "bg-[#FF6B35]" : "bg-gray-700",
              toggleDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isActive ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        )}
      </div>

      <div className="mt-6">
        <Link
          href={href}
          className={cn(
            "inline-flex items-center justify-center w-full min-h-[44px] px-4 py-2 rounded-lg font-semibold transition-colors",
            locked
              ? "bg-gray-800 text-gray-200 hover:bg-gray-700"
              : "bg-[#FF6B35] text-white hover:bg-[#e55a2b]"
          )}
        >
          {ctaLabel}
        </Link>

        {secondaryHref && secondaryLabel && !locked && (
          <Link
            href={secondaryHref}
            className="mt-3 inline-flex w-full justify-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    </div>
  );
};

export default AutomationCard;
