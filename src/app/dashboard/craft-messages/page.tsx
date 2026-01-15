"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import MessageCrafter from "@/components/MessageCrafter";
import { Lead } from "@/components/LeadScraper";
import { hasFeature } from "@/lib/feature-access";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CraftMessagesPage() {
  const { user } = useUser();
  const userPlan = user?.unsafeMetadata?.plan as "lite" | "solo" | "pro" | undefined;
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<{
    whatsapp: string;
    email: string;
    social: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAccess = hasFeature(userPlan, userEmail, "messageCrafting");

  // Load lead from sessionStorage on mount
  useEffect(() => {
    const savedLead = sessionStorage.getItem('selectedLeadForCraft');
    if (savedLead) {
      try {
        const lead = JSON.parse(savedLead);
        setSelectedLead(lead);
        // Auto-craft messages for this lead
        craftMessages(lead);
        // Clear from session so page refresh requires selecting again
        sessionStorage.removeItem('selectedLeadForCraft');
      } catch {
        setError('Failed to load lead. Please go back to Lead Scraper and try again.');
      }
    }
  }, []);

  const craftMessages = async (lead: Lead) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/craft-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });

      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to craft messages. Please try again.');
      console.error('Error crafting messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">This feature is only available for Solo and Pro plans.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Show error if no lead selected
  if (!selectedLead) {
    return (
      <div className="p-8">
        <Link href="/dashboard/lead-scraper" className="flex items-center gap-2 text-blue-600 hover:underline mb-8">
          <ArrowLeft size={18} /> Back to Lead Scraper
        </Link>
        
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-yellow-900 mb-2">No Lead Selected</h2>
          <p className="text-yellow-700 mb-4">
            To craft messages, you need to select a lead from the Lead Scraper first.
          </p>
          <Link 
            href="/dashboard/lead-scraper"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Lead Scraper
          </Link>
        </div>
      </div>
    );
  }

  // Show error if message crafting failed
  if (error) {
    return (
      <div className="p-8">
        <Link href="/dashboard/lead-scraper" className="flex items-center gap-2 text-blue-600 hover:underline mb-8">
          <ArrowLeft size={18} /> Back to Lead Scraper
        </Link>
        
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">Error Crafting Messages</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link 
            href="/dashboard/lead-scraper"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Another Lead
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/dashboard/lead-scraper" className="flex items-center gap-2 text-blue-600 hover:underline mb-6">
        <ArrowLeft size={18} /> Back to Lead Scraper
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Craft Messages</h1>
        <p className="text-gray-600">
          Personalized messages for {selectedLead.firstName} {selectedLead.lastName} at {selectedLead.company}
        </p>
      </div>

      {/* Lead Details Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-8">
        <h3 className="text-lg font-bold mb-4">Lead Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">Name:</span> {selectedLead.firstName} {selectedLead.lastName}
          </div>
          <div>
            <span className="font-semibold">Company:</span> {selectedLead.company}
          </div>
          <div>
            <span className="font-semibold">Title:</span> {selectedLead.title}
          </div>
          <div>
            <span className="font-semibold">Location:</span> {selectedLead.location}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {selectedLead.email}
          </div>
          <div>
            <span className="font-semibold">Industry:</span> {selectedLead.industry}
          </div>
          <div>
            <span className="font-semibold">Company Size:</span> {selectedLead.companySize}
          </div>
          {selectedLead.matchQualityScore && (
            <div>
              <span className="font-semibold">Match Score:</span> {selectedLead.matchQualityScore}%
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageCrafter 
        lead={selectedLead}
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  );
}
