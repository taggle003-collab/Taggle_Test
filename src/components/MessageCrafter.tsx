"use client";

import React from "react";
import { Lead } from "./LeadScraper";
import { MessageCircle, Mail, Share2, Copy, Check, Loader2 } from "lucide-react";

interface Message {
  whatsapp: string;
  email: string;
  social: string;
}

interface MessageCrafterProps {
  lead: Lead;
  messages: Message | null;
  isLoading: boolean;
}

export default function MessageCrafter({ lead, messages, isLoading }: MessageCrafterProps) {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold mb-4">Lead Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Name:</span> {lead.firstName} {lead.lastName}
          </div>
          <div>
            <span className="font-semibold">Company:</span> {lead.company}
          </div>
          <div>
            <span className="font-semibold">Title:</span> {lead.title}
          </div>
          <div>
            <span className="font-semibold">Location:</span> {lead.location}
          </div>
          <div>
            <span className="font-semibold">Email:</span> {lead.email}
          </div>
          <div>
            <span className="font-semibold">Industry:</span> {lead.industry}
          </div>
          <div>
            <span className="font-semibold">Company Size:</span> {lead.companySize}
          </div>
          {lead.matchQualityScore && (
            <div>
              <span className="font-semibold">Match Score:</span> {lead.matchQualityScore}%
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Crafting personalized messages...</span>
        </div>
      ) : messages ? (
        <div className="space-y-4">
          <div className="border border-green-200 bg-green-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="text-green-600 mr-2" size={20} />
              <h4 className="font-bold text-green-900">WhatsApp Message</h4>
            </div>
            <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">
              {messages.whatsapp}
            </p>
            <button
              onClick={() => copyToClipboard(messages.whatsapp, "whatsapp")}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {copied === "whatsapp" ? (
                <><Check size={16} className="mr-2" /> Copied!</>
              ) : (
                <><Copy size={16} className="mr-2" /> Copy</>
              )}
            </button>
          </div>

          <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Mail className="text-blue-600 mr-2" size={20} />
              <h4 className="font-bold text-blue-900">Email Message</h4>
            </div>
            <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">
              {messages.email}
            </p>
            <button
              onClick={() => copyToClipboard(messages.email, "email")}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {copied === "email" ? (
                <><Check size={16} className="mr-2" /> Copied!</>
              ) : (
                <><Copy size={16} className="mr-2" /> Copy</>
              )}
            </button>
          </div>

          <div className="border border-purple-200 bg-purple-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Share2 className="text-purple-600 mr-2" size={20} />
              <h4 className="font-bold text-purple-900">LinkedIn/Social Media</h4>
            </div>
            <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">
              {messages.social}
            </p>
            <button
              onClick={() => copyToClipboard(messages.social, "social")}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              {copied === "social" ? (
                <><Check size={16} className="mr-2" /> Copied!</>
              ) : (
                <><Copy size={16} className="mr-2" /> Copy</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            Messages will appear here after you select a lead
          </p>
        </div>
      )}
    </div>
  );
}
