"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import LeadSelector from "./LeadSelector";
import ToneForm, { ToneType } from "./ToneForm";
import ModalMessageCards from "./ModalMessageCards";
import { Lead } from "@/lib/lead-types";
import { useCraftMessages } from "@/lib/contexts/CraftMessagesContext";

export default function CraftMessagesModal() {
  const { isOpen, closeCraftMessages, selectedLead: initialLead } = useCraftMessages();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Form State
  const [tone, setTone] = useState<ToneType>("Professional");
  const [style, setStyle] = useState("");
  const [sampleLines, setSampleLines] = useState("");
  const [talkingPoints, setTalkingPoints] = useState("");
  
  // Result State
  const [messages, setMessages] = useState<{ whatsapp: string; email: string; social: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set lead if provided by context
  useEffect(() => {
    if (initialLead) {
      setSelectedLead(initialLead);
    }
  }, [initialLead]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setMessages(null);
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const handleCraft = async () => {
    if (!selectedLead) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/craft-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: selectedLead,
          tone,
          style,
          sampleLines,
          talkingPoints,
        }),
      });

      if (!response.ok) throw new Error("Failed to craft messages");

      const data = await response.json();
      setMessages(data.messages);
      setStep(2);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (platform: "whatsapp" | "email" | "social") => {
    if (!selectedLead) return;
    setRegeneratingPlatform(platform);

    try {
      const response = await fetch("/api/craft-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: selectedLead,
          tone,
          style,
          sampleLines,
          talkingPoints,
          platformType: platform,
        }),
      });

      if (!response.ok) throw new Error("Failed to regenerate message");

      const data = await response.json();
      if (messages) {
        setMessages({
          ...messages,
          [platform]: data.message,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={closeCraftMessages}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#1a1a1a] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/20">
              <Sparkles className="text-[#FF6B35]" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Craft Messages</h2>
              <p className="text-xs text-gray-500">Step {step} of 2: {step === 1 ? "Lead & Tone" : "Generated Messages"}</p>
            </div>
          </div>
          <button 
            onClick={closeCraftMessages}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-8">
              <LeadSelector 
                selectedLead={selectedLead} 
                onLeadSelect={setSelectedLead} 
              />
              
              <div className={selectedLead ? "opacity-100 transition-opacity duration-500" : "opacity-50 pointer-events-none"}>
                <ToneForm
                  tone={tone}
                  setTone={setTone}
                  style={style}
                  setStyle={setStyle}
                  sampleLines={sampleLines}
                  setSampleLines={setSampleLines}
                  talkingPoints={talkingPoints}
                  setTalkingPoints={setTalkingPoints}
                  onSubmit={handleCraft}
                  isLoading={isLoading}
                />
              </div>
            </div>
          ) : (
            messages && (
              <ModalMessageCards
                messages={messages}
                onRegenerate={handleRegenerate}
                regeneratingPlatform={regeneratingPlatform}
                onBack={() => setStep(1)}
              />
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900/30 border-t border-gray-800 flex justify-center">
          <button 
            onClick={closeCraftMessages}
            className="text-gray-500 hover:text-gray-400 text-sm font-medium transition-colors"
          >
            Close Modal
          </button>
        </div>
      </div>
    </div>
  );
}
