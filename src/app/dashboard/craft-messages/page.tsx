"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import LeadSelector from "@/components/LeadSelector";
import MessageCrafter from "@/components/MessageCrafter";
import { Lead } from "@/components/LeadScraper";
import { hasFeature } from "@/lib/feature-access";

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

  const canAccess = hasFeature(userPlan, userEmail, "messageCrafting");

  const handleLeadSelect = async (lead: Lead) => {
    setSelectedLead(lead);
    setMessages(null);
    await craftMessages(lead);
  };

  const craftMessages = async (lead: Lead) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/craft-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      });

      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error crafting messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600">This feature is only available for Solo and Pro plans.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Craft Messages</h1>
      <p className="text-gray-600 mb-8">
        Select a lead and we&apos;ll craft personalized messages tailored to your ICP
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LeadSelector
            onLeadSelect={handleLeadSelect}
            selectedLead={selectedLead}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedLead ? (
            <MessageCrafter
              lead={selectedLead}
              messages={messages}
              isLoading={isLoading}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500">
                Select a lead to craft personalized messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
