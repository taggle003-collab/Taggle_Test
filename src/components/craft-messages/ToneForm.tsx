"use client";

import React from "react";
import { MessageSquare, FileText, PenLine, Sparkles } from "lucide-react";

export type ToneType = "Professional" | "Friendly" | "Casual" | "Sales-Focused" | "Creative";

interface ToneFormProps {
  tone: ToneType;
  setTone: (tone: ToneType) => void;
  style: string;
  setStyle: (style: string) => void;
  sampleLines: string;
  setSampleLines: (lines: string) => void;
  talkingPoints: string;
  setTalkingPoints: (points: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ToneForm({
  tone,
  setTone,
  style,
  setStyle,
  sampleLines,
  setSampleLines,
  talkingPoints,
  setTalkingPoints,
  onSubmit,
  isLoading,
}: ToneFormProps) {
  const tones: ToneType[] = ["Professional", "Friendly", "Casual", "Sales-Focused", "Creative"];

  const isValid = tone && style && sampleLines.length >= 20;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <Sparkles size={14} className="text-[#FF6B35]" />
          Select Tone
        </label>
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tone === t
                  ? "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/20"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <MessageSquare size={14} className="text-[#FF6B35]" />
          Describe your messaging style
        </label>
        <textarea
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="e.g., Short, direct, focuses on ROI, mentions their recent LinkedIn post..."
          className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#FF6B35] outline-none transition-all min-h-[80px] resize-none"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <FileText size={14} className="text-[#FF6B35]" />
          Provide 2-3 example messages of how you typically write (Required)
        </label>
        <textarea
          value={sampleLines}
          onChange={(e) => setSampleLines(e.target.value)}
          placeholder="Copy and paste a few messages you've actually sent. Min 20 chars."
          className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#FF6B35] outline-none transition-all min-h-[120px] resize-none"
        />
        <div className="text-[10px] text-gray-500 flex justify-between">
          <span>{sampleLines.length} characters</span>
          <span>{sampleLines.length < 20 ? "At least 20 chars required" : "Looks good!"}</span>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <PenLine size={14} className="text-[#FF6B35]" />
          Additional Talking Points (Optional)
        </label>
        <textarea
          value={talkingPoints}
          onChange={(e) => setTalkingPoints(e.target.value)}
          placeholder="Any specific value props or common ground to mention?"
          className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:border-[#FF6B35] outline-none transition-all min-h-[80px] resize-none"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!isValid || isLoading}
        className="w-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] hover:from-[#e55a2b] hover:to-[#FF6B35] text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#FF6B35]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Crafting Messages...
          </>
        ) : (
          <>
            <Sparkles size={20} />
            Craft Messages
          </>
        )}
      </button>
    </div>
  );
}
