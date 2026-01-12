"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Save, Check, Mail, MessageCircle, Wand2, Loader2 } from "lucide-react";
import type { Lead } from "./LeadScraper";

interface MessageCrafterProps {
  lead: Lead;
  onClose: () => void;
}

type ChannelType = "email" | "whatsapp";

interface MessageTemplate {
  email: {
    subject: string;
    body: string;
  };
  whatsapp: {
    body: string;
  };
}

const MessageCrafter = ({ lead, onClose }: MessageCrafterProps) => {
  const [channel, setChannel] = useState<ChannelType>("email");
  const [generatedMessage, setGeneratedMessage] = useState<MessageTemplate | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const WHATSAPP_CHAR_LIMIT = 2048;

  useEffect(() => {
    generateMessage();
  }, [lead, channel]);

  useEffect(() => {
    if (channel === "whatsapp") {
      setCharCount(editedMessage.length);
    }
  }, [editedMessage, channel]);

  const generateMessage = () => {
    setIsGenerating(true);

    // Simulate AI generation with realistic delay
    setTimeout(() => {
      const templates = generateTemplates(lead);
      setGeneratedMessage(templates);

      if (channel === "email") {
        setSubject(templates.email.subject);
        setEditedMessage(templates.email.body);
      } else {
        setEditedMessage(templates.whatsapp.body);
      }

      setIsGenerating(false);
    }, 1000);
  };

  const generateTemplates = (l: Lead): MessageTemplate => {
    // Generate context-aware templates based on lead details
    const companyContext = l.company ? `working at ${l.company}` : "your work";
    const titleContext = l.title ? `as a ${l.title.toLowerCase()}` : "";
    const locationContext = l.location ? `in ${l.location}` : "";
    const industryContext = l.industry ? `${l.industry.toLowerCase()} companies` : "companies like yours";

    // Detect industry keywords for context
    let painPoint = "streamline your operations";
    let solution = "help teams work smarter";

    const industryLower = l.industry?.toLowerCase() || "";
    if (industryLower.includes("tech") || industryLower.includes("saas") || industryLower.includes("software")) {
      painPoint = "accelerate growth and reduce churn";
      solution = "help SaaS companies scale efficiently";
    } else if (industryLower.includes("finance") || industryLower.includes("banking") || industryLower.includes("fintech")) {
      painPoint = "manage risk and compliance";
      solution = "support financial institutions with smart automation";
    } else if (industryLower.includes("health") || industryLower.includes("medical") || industryLower.includes("healthcare")) {
      painPoint = "improve patient care and operational efficiency";
      solution = "help healthcare providers focus on what matters most";
    } else if (industryLower.includes("retail") || industryLower.includes("ecommerce")) {
      painPoint = "drive sales and customer retention";
      solution = "support retail and e-commerce growth initiatives";
    } else if (industryLower.includes("marketing") || industryLower.includes("agency")) {
      painPoint = "deliver better results for clients";
      solution = "help agencies scale their operations";
    } else if (industryLower.includes("real estate") || industryLower.includes("property")) {
      painPoint = "close more deals faster";
      solution = "support real estate professionals grow their business";
    } else if (industryLower.includes("manufacturing") || industryLower.includes("industrial")) {
      painPoint = "optimize production and supply chain";
      solution = "help manufacturers improve efficiency";
    }

    const name = l.firstName || "there";

    return {
      email: {
        subject: `Quick question about ${l.company || "your company"}`,
        body: `Hi ${name},

Saw your profile ${companyContext} ${locationContext} and thought this was worth a quick note.

We ${industryContext} ${solution}. Most see meaningful results in the first few weeks, especially when it comes to ${painPoint}.

Any interest in seeing how it works? Happy to jump on a 15-min call if you're open to it.

Best,
[Your name]`
      },
      whatsapp: {
        body: `Hey ${name}! Came across your profile and thought we should connect. 

Working with ${industryContext} on ${painPoint} - the results have been pretty solid so far.

Quick question - are you actively looking at solutions in this space, or is it more of a backburner item for now?

Cheers,
[Your name]`
      }
    };
  };

  const handleCopy = async () => {
    try {
      const text = channel === "email" 
        ? `Subject: ${subject}\n\n${editedMessage}`
        : editedMessage;
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSave = () => {
    // Save to localStorage as template
    const templates = JSON.parse(localStorage.getItem("messageTemplates") || "[]");
    const newTemplate = {
      id: Date.now().toString(),
      name: `${channel === "email" ? "Email" : "WhatsApp"} for ${lead.firstName} ${lead.lastName}`,
      channel,
      subject: channel === "email" ? subject : undefined,
      body: editedMessage,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("messageTemplates", JSON.stringify([...templates, newTemplate]));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Craft Outreach Message</h2>
            <p className="text-gray-400 text-sm mt-1">AI-powered message crafting for your lead</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Selected Lead Info */}
          <div className="bg-black rounded-lg p-4 mb-6 border border-gray-800">
            <div className="text-xs text-gray-500 mb-2">Selected Lead</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                <span className="text-[#FF6B35] font-semibold">
                  {lead.firstName?.[0]}{lead.lastName?.[0]}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">{lead.firstName} {lead.lastName}</div>
                <div className="text-gray-400 text-sm">{lead.title} at {lead.company}</div>
              </div>
            </div>
          </div>

          {/* Channel Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Choose Channel</label>
            <div className="flex gap-3">
              <button
                onClick={() => setChannel("email")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  channel === "email"
                    ? "bg-[#FF6B35]/20 border-[#FF6B35] text-[#FF6B35]"
                    : "bg-black border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                <Mail size={18} />
                Email
              </button>
              <button
                onClick={() => setChannel("whatsapp")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  channel === "whatsapp"
                    ? "bg-[#FF6B35]/20 border-[#FF6B35] text-[#FF6B35]"
                    : "bg-black border-gray-700 text-gray-400 hover:border-gray-600"
                }`}
              >
                <MessageCircle size={18} />
                WhatsApp
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateMessage}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 mb-6"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating message...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Regenerate Message
              </>
            )}
          </button>

          {/* Message Editor */}
          <div className="space-y-4">
            {channel === "email" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FF6B35] outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  {channel === "email" ? "Message Body" : "Message"}
                </label>
                {channel === "whatsapp" && (
                  <span className={`text-xs ${charCount > WHATSAPP_CHAR_LIMIT ? 'text-red-400' : 'text-gray-500'}`}>
                    {charCount}/{WHATSAPP_CHAR_LIMIT} characters
                  </span>
                )}
              </div>
              <textarea
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                rows={8}
                className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#FF6B35] outline-none transition-colors resize-none"
              />
            </div>

            {/* Feedback Question */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-300 text-sm mb-3">Want to adjust anything before sending?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    // Make it shorter
                    const sentences = editedMessage.split(/[.!?]+/).filter(s => s.trim());
                    if (sentences.length > 2) {
                      setEditedMessage(sentences.slice(0, 2).join(". ").trim() + ".");
                    }
                  }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors"
                >
                  Make it shorter
                </button>
                <button
                  onClick={() => {
                    // Make it more casual
                    setEditedMessage(editedMessage.replace(/Sincerely|Best regards|Best,/gi, "Cheers"));
                  }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors"
                >
                  More casual tone
                </button>
                <button
                  onClick={() => {
                    // Add call to action
                    setEditedMessage(editedMessage + "\n\nLet me know if you're interested - happy to work around your schedule.");
                  }}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors"
                >
                  Add follow-up CTA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-800 bg-black/50">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            {isSaved ? <Check size={18} className="text-green-400" /> : <Save size={18} />}
            <span>{isSaved ? "Saved!" : "Save Template"}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
          >
            {isCopied ? <Check size={18} /> : <Copy size={18} />}
            {isCopied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageCrafter;
