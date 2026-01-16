"use client";

import React, { useState } from "react";
import { Sparkles, Send } from "lucide-react";

interface ToneSelectionModalProps {
  onProceed: (data: ToneData) => void;
  initialData?: ToneData;
}

export interface ToneData {
  tone: string;
  style: string;
  sampleLines: string;
  talkingPoints: string;
}

const TONES = [
  { id: "professional", label: "Professional", icon: "👔" },
  { id: "friendly", label: "Friendly", icon: "😊" },
  { id: "casual", label: "Casual", icon: "👋" },
  { id: "sales-focused", label: "Sales-Focused", icon: "💰" },
  { id: "creative", label: "Creative", icon: "🎨" },
];

export default function ToneSelectionModal({ onProceed, initialData }: ToneSelectionModalProps) {
  const [formData, setFormData] = useState<ToneData>(initialData || {
    tone: "professional",
    style: "",
    sampleLines: "",
    talkingPoints: "",
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sampleLines.length < 20) {
      setError("Sample lines must be at least 20 characters long.");
      return;
    }
    setError(null);
    onProceed(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-blue-200" size={24} />
            <h2 className="text-2xl font-bold">Customize Your Message Tone</h2>
          </div>
          <p className="text-blue-100">Tell us how you want to sound to your lead.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Tone Select</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, tone: t.id })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    formData.tone === t.id
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-100 bg-gray-50 text-gray-500 hover:border-blue-200 hover:bg-blue-50/30"
                  }`}
                >
                  <span className="text-2xl mb-1">{t.icon}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Preference */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Style Preference</label>
            <textarea
              required
              value={formData.style}
              onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              placeholder="e.g., Direct and punchy, storytelling approach, focus on mutual benefits..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[80px]"
            />
          </div>

          {/* Sample Lines */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Sample Lines</label>
            <p className="text-xs text-gray-500 mb-2">Provide 2-3 sample lines of how you typically message (min 20 chars)</p>
            <textarea
              required
              value={formData.sampleLines}
              onChange={(e) => setFormData({ ...formData, sampleLines: e.target.value })}
              placeholder="Hi, I saw your post about... I thought you might be interested in..."
              className={`w-full px-4 py-3 rounded-xl border ${
                error ? "border-red-300 bg-red-50" : "border-gray-200"
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px]`}
            />
            {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
          </div>

          {/* Talking Points */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Talking Points (Optional)</label>
            <p className="text-xs text-gray-500 mb-2">Any specific details or context to include?</p>
            <textarea
              value={formData.talkingPoints}
              onChange={(e) => setFormData({ ...formData, talkingPoints: e.target.value })}
              placeholder="Mention our recent integration with Slack, or the 20% discount for new users..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[80px]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-800 transition-all flex items-center justify-center gap-2"
          >
            <Send size={20} />
            Generate Personalized Messages
          </button>
        </form>
      </div>
    </div>
  );
}
