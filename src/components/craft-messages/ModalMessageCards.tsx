"use client";

import React, { useState } from "react";
import { Copy, Check, RefreshCw, Mail, Linkedin, MessageCircle } from "lucide-react";

interface Message {
  whatsapp: string;
  email: string;
  social: string;
}

interface ModalMessageCardsProps {
  messages: Message;
  onRegenerate: (platform: "whatsapp" | "email" | "social") => void;
  regeneratingPlatform: string | null;
  onBack: () => void;
}

export default function ModalMessageCards({
  messages,
  onRegenerate,
  regeneratingPlatform,
  onBack,
}: ModalMessageCardsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  const platforms = [
    {
      id: "whatsapp" as const,
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600",
      textColor: "text-green-400",
      content: messages.whatsapp,
    },
    {
      id: "email" as const,
      name: "Email",
      icon: Mail,
      color: "bg-blue-600",
      textColor: "text-blue-400",
      content: messages.email,
    },
    {
      id: "social" as const,
      name: "LinkedIn / Social",
      icon: Linkedin,
      color: "bg-purple-600",
      textColor: "text-purple-400",
      content: messages.social,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden flex flex-col transition-all hover:border-gray-700"
          >
            <div className={`p-4 ${platform.color} flex items-center justify-between`}>
              <div className="flex items-center gap-2 text-white font-bold">
                <platform.icon size={18} />
                {platform.name}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(platform.content, platform.id)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  title="Copy to clipboard"
                >
                  {copied === platform.id ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => onRegenerate(platform.id)}
                  disabled={!!regeneratingPlatform}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors disabled:opacity-50"
                  title="Regenerate this platform"
                >
                  <RefreshCw
                    size={16}
                    className={regeneratingPlatform === platform.id ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>
            <div className="p-5 flex-1 relative">
              {regeneratingPlatform === platform.id && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                {platform.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-6 rounded-xl border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 font-semibold transition-all text-center"
        >
          Change Tone & Details
        </button>
      </div>
    </div>
  );
}
