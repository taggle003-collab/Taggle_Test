import React from "react";
import LeadScraper from "@/components/LeadScraper";

export const metadata = {
  title: "Lead Scraper | Taggle",
  description: "Scrape leads based on your Ideal Customer Profile",
};

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Lead Scraper</h1>
        <p className="text-gray-400">
          Find and export leads that match your Ideal Customer Profile (ICP).
        </p>
      </div>
      
      <LeadScraper />
    </div>
  );
}
