"use client";

import React from "react";
import { Lead } from "./LeadScraper";
import { 
  MessageCircle, 
  Mail, 
  Share2, 
  Copy, 
  Check, 
  Loader2, 
  RotateCw,
  Edit3
} from "lucide-react";

interface Message {
  whatsapp: string;
  email: string;
  social: string;
}

interface MessageCrafterProps {
  lead: Lead;
  messages: Message | null;
  isLoading: boolean;
  onRegenerate: (platform: "whatsapp" | "email" | "social") => void;
  onEdit: () => void;
}

export default function MessageCrafter({ 
  lead, 
  messages, 
  isLoading, 
  onRegenerate,
  onEdit
}: MessageCrafterProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading && !messages) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <h3 className="text-xl font-bold text-gray-900">Crafting your messages...</h3>
        <p className="text-gray-500 mt-2">Our AI is matching your tone and style preference.</p>
      </div>
    );
  }

  if (!messages) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 shadow-sm">
        <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Edit3 className="text-blue-600" size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to craft messages?</h3>
        <p className="text-gray-500 max-w-sm mx-auto mb-8">
          Set your preferred tone and style to generate personalized outreach for {lead.firstName}.
        </p>
        <button 
          onClick={onEdit}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          Set Tone & Style
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* WhatsApp Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <div className="bg-emerald-500 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <MessageCircle size={20} />
            <span className="font-bold uppercase tracking-wider text-xs">WhatsApp Message</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onRegenerate("whatsapp")}
              disabled={isLoading}
              className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition disabled:opacity-50"
              title="Regenerate WhatsApp message"
            >
              <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6 text-lg">
            {messages.whatsapp}
          </p>
          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <button
              onClick={() => copyToClipboard(messages.whatsapp, "whatsapp")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                copied === "whatsapp" 
                  ? "bg-emerald-100 text-emerald-700" 
                  : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100"
              }`}
            >
              {copied === "whatsapp" ? (
                <><Check size={18} /> Copied!</>
              ) : (
                <><Copy size={18} /> Copy Message</>
              )}
            </button>
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
              Casual / Mobile
            </span>
          </div>
        </div>
      </div>

      {/* Email Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <div className="bg-blue-600 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Mail size={20} />
            <span className="font-bold uppercase tracking-wider text-xs">Email Outreach</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onRegenerate("email")}
              disabled={isLoading}
              className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition disabled:opacity-50"
              title="Regenerate Email message"
            >
              <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6 text-lg">
            {messages.email}
          </p>
          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <button
              onClick={() => copyToClipboard(messages.email, "email")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                copied === "email" 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
              }`}
            >
              {copied === "email" ? (
                <><Check size={18} /> Copied!</>
              ) : (
                <><Copy size={18} /> Copy Email</>
              )}
            </button>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
              Professional / Structured
            </span>
          </div>
        </div>
      </div>

      {/* LinkedIn/Social Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
        <div className="bg-purple-600 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Share2 size={20} />
            <span className="font-bold uppercase tracking-wider text-xs">LinkedIn / Social</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onRegenerate("social")}
              disabled={isLoading}
              className="p-1.5 bg-white/20 rounded-lg text-white hover:bg-white/30 transition disabled:opacity-50"
              title="Regenerate Social message"
            >
              <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-6 text-lg">
            {messages.social}
          </p>
          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <button
              onClick={() => copyToClipboard(messages.social, "social")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                copied === "social" 
                  ? "bg-purple-100 text-purple-700" 
                  : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-100"
              }`}
            >
              {copied === "social" ? (
                <><Check size={18} /> Copied!</>
              ) : (
                <><Copy size={18} /> Copy for LinkedIn</>
              )}
            </button>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded">
              Networking / Brief
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
