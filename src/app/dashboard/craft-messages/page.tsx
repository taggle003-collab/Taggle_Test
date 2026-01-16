"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import MessageCrafter from "@/components/MessageCrafter";
import { Lead } from "@/components/LeadScraper";
import { hasFeature } from "@/lib/feature-access";
import { ArrowLeft, Settings2 } from "lucide-react";
import Link from "next/link";
import ToneSelectionModal, { ToneData } from "@/components/ToneSelectionModal";

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
  const [showToneModal, setShowToneModal] = useState(false);
  const [toneData, setToneData] = useState<ToneData | null>(null);

  const canAccess = hasFeature(userPlan, userEmail, "messageCrafting");

  // Load lead from sessionStorage on mount
  useEffect(() => {
    const savedLead = sessionStorage.getItem('selectedLeadForCraft');
    if (savedLead) {
      try {
        const lead = JSON.parse(savedLead);
        setSelectedLead(lead);
        setShowToneModal(true);
        // Clear from session so page refresh requires selecting again
        sessionStorage.removeItem('selectedLeadForCraft');
      } catch {
        setError('Failed to load lead. Please go back to Lead Scraper and try again.');
      }
    }
  }, []);

  const handleToneSubmit = (data: ToneData) => {
    setToneData(data);
    setShowToneModal(false);
    if (selectedLead) {
      craftMessages(selectedLead, data);
    }
  };

  const craftMessages = async (lead: Lead, tone: ToneData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/craft-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lead,
          ...tone
        }),
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

  const handleRegenerateOne = async (platform: "whatsapp" | "email" | "social") => {
    if (!selectedLead || !toneData) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/craft-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          lead: selectedLead,
          ...toneData,
          platformType: platform
        }),
      });

      const data = await response.json();

      if (data.message && messages) {
        setMessages({
          ...messages,
          [platform]: data.message
        });
      }
    } catch (err) {
      console.error(`Error regenerating ${platform} message:`, err);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/lead-scraper" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={18} /> Back to Lead Scraper
        </Link>
        
        {messages && !isLoading && (
          <button 
            onClick={() => setShowToneModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
          >
            <Settings2 size={16} />
            Change Tone & Style
          </button>
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Craft Messages</h1>
        <p className="text-gray-600">
          Personalized messages for {selectedLead.firstName} {selectedLead.lastName} at {selectedLead.company}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="text-red-900 font-bold">×</button>
        </div>
      )}

      {/* Lead Details Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 mb-8 shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-indigo-900 flex items-center gap-2">
          Lead Context
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-sm">
          <div>
            <span className="text-gray-500 block">Name</span>
            <span className="font-semibold">{selectedLead.firstName} {selectedLead.lastName}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Company</span>
            <span className="font-semibold">{selectedLead.company}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Role</span>
            <span className="font-semibold truncate block" title={selectedLead.title}>{selectedLead.title}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Industry</span>
            <span className="font-semibold">{selectedLead.industry}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageCrafter 
        lead={selectedLead}
        messages={messages}
        isLoading={isLoading}
        onRegenerate={handleRegenerateOne}
        onEdit={() => setShowToneModal(true)}
      />

      {showToneModal && (
        <ToneSelectionModal 
          onProceed={handleToneSubmit}
          initialData={toneData || undefined}
        />
      )}
    </div>
  );
}
