"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { hasFeature } from "@/lib/feature-access";
import UpgradePrompt from "@/components/UpgradePrompt";
import { MessageSquare, Search, Mail, MessageCircle, Copy, Check, Save, Trash2, ExternalLink } from "lucide-react";

interface SavedTemplate {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  createdAt: string;
}

const MessagesPage = () => {
  const { user, isLoaded } = useUser();
  const userPlan = user?.unsafeMetadata?.plan as "lite" | "solo" | "pro" | undefined;
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  const canCraftMessage = hasFeature(userPlan, userEmail, "messageCrafting");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SavedTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const templates = JSON.parse(localStorage.getItem("messageTemplates") || "[]");
      setSavedTemplates(templates);
    }
  }, []);

  const filteredTemplates = savedTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = async (template: SavedTemplate) => {
    try {
      const text = template.channel === "email"
        ? `Subject: ${template.subject}\n\n${template.body}`
        : template.body;
      await navigator.clipboard.writeText(text);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem("messageTemplates", JSON.stringify(updated));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  if (!canCraftMessage) {
    return (
      <div className="py-8">
        <UpgradePrompt
          requiredPlan="Solo"
          featureName="AI Message Crafting"
          description="Craft professional sales outreach messages for email and WhatsApp. Upgrade to access this feature."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#FF6B35]/20 rounded-lg">
            <MessageSquare className="text-[#FF6B35]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Craft Outreach Message</h1>
            <p className="text-gray-400 text-sm">AI-powered professional sales messages for your leads</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={18} className="text-[#FF6B35]" />
              <span className="text-white font-medium">Email Templates</span>
            </div>
            <p className="text-gray-400 text-sm">Professional cold emails with personalized subject lines</p>
          </div>
          <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={18} className="text-green-400" />
              <span className="text-white font-medium">WhatsApp Templates</span>
            </div>
            <p className="text-gray-400 text-sm">Casual, conversational messages for WhatsApp outreach</p>
          </div>
          <div className="bg-black/50 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Save size={18} className="text-blue-400" />
              <span className="text-white font-medium">Saved Templates</span>
            </div>
            <p className="text-gray-400 text-sm">{savedTemplates.length} templates saved for reuse</p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Start</h2>
        <p className="text-gray-400 mb-4">
          The easiest way to craft a message is from the Lead Scraper. After scraping leads, 
          click "Craft Message" on any lead card to generate a personalized outreach message.
        </p>
        <a
          href="/dashboard/leads"
          className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e55a2b] transition-colors"
        >
          <Search size={18} />
          Go to Lead Scraper
        </a>
      </div>

      {/* Saved Templates */}
      {savedTemplates.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white">Saved Templates</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-[#FF6B35] outline-none"
              />
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              {searchTerm ? "No templates match your search" : "No saved templates yet"}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-black rounded-lg border p-4 transition-colors ${
                    selectedTemplate?.id === template.id ? "border-[#FF6B35]" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-medium">{template.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          template.channel === "email" 
                            ? "bg-blue-900/30 text-blue-400" 
                            : "bg-green-900/30 text-green-400"
                        }`}>
                          {template.channel === "email" ? "Email" : "WhatsApp"}
                        </span>
                      </div>
                      {template.channel === "email" && template.subject && (
                        <p className="text-gray-500 text-sm mb-1">Subject: {template.subject}</p>
                      )}
                      <p className="text-gray-400 text-sm line-clamp-2">{template.body}</p>
                      <p className="text-gray-600 text-xs mt-2">
                        Saved on {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(template)}
                        className="text-gray-400 hover:text-[#FF6B35] transition-colors p-2"
                        title="Copy to clipboard"
                      >
                        {copiedId === template.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        title="Delete template"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {savedTemplates.length === 0 && (
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-12 text-center">
          <MessageSquare className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No Saved Templates</h3>
          <p className="text-gray-400 mb-4">
            When you craft messages from the Lead Scraper, you can save them as templates to reuse later.
          </p>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
