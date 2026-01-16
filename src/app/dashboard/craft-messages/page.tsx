'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Lead } from '@/components/LeadScraper';
import ToneStyleForm, { ToneStyleData } from '@/components/ToneStyleForm';
import ModernMessageCard from '@/components/ModernMessageCard';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { hasFeature } from '@/lib/feature-access';

interface Messages {
  whatsapp: string;
  email: string;
  linkedin: string;
}

export default function CraftMessagesPage() {
  const { user } = useUser();
  const userPlan = user?.unsafeMetadata?.plan as 'lite' | 'solo' | 'pro' | undefined;
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [step, setStep] = useState<'form' | 'messages'>('form');
  const [messages, setMessages] = useState<Messages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toneData, setToneData] = useState<ToneStyleData | null>(null);
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<'whatsapp' | 'email' | 'linkedin' | null>(null);

  const canAccess = hasFeature(userPlan, userEmail, 'messageCrafting');

  // Load lead from sessionStorage on mount
  useEffect(() => {
    const savedLead = sessionStorage.getItem('selectedLeadForCraft');
    if (savedLead) {
      try {
        const lead = JSON.parse(savedLead);
        setSelectedLead(lead);
        sessionStorage.removeItem('selectedLeadForCraft');
      } catch {
        setError('Failed to load lead. Please go back to Lead Scraper and try again.');
      }
    }
  }, []);

  const handleToneSubmit = async (data: ToneStyleData) => {
    setToneData(data);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/craft-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: selectedLead,
          tone: data.tone,
          sampleText: data.sampleText,
          talkingPoints: data.talkingPoints
        })
      });

      const result = await response.json();

      if (result.messages) {
        setMessages(result.messages);
        setStep('messages');
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to craft messages. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (platform: 'whatsapp' | 'email' | 'linkedin') => {
    setRegeneratingPlatform(platform);
    try {
      const response = await fetch('/api/craft-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: selectedLead,
          tone: toneData?.tone,
          sampleText: toneData?.sampleText,
          talkingPoints: toneData?.talkingPoints,
          platform: platform
        })
      });

      const result = await response.json();
      if (result.messages) {
        setMessages((prev) => ({
          whatsapp: platform === 'whatsapp' ? result.messages.whatsapp : prev!.whatsapp,
          email: platform === 'email' ? result.messages.email : prev!.email,
          linkedin: platform === 'linkedin' ? result.messages.linkedin : prev!.linkedin
        }));
      }
    } catch (err) {
      console.error('Error regenerating:', err);
    } finally {
      setRegeneratingPlatform(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This feature is only available for Solo and Pro plans.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show error if no lead selected
  if (!selectedLead && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-yellow-900 mb-2">No Lead Selected</h2>
            <p className="text-yellow-700 mb-6">
              To craft messages, select a lead from the Lead Scraper first.
            </p>
            <Link
              href="/dashboard/lead-scraper"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Go to Lead Scraper
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show error if message crafting failed
  if (error && step === 'messages') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Link href="/dashboard/lead-scraper" className="flex items-center gap-2 text-blue-600 hover:underline mb-6 font-semibold">
            <ArrowLeft size={20} /> Back to Lead Scraper
          </Link>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={() => setStep('form')}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/lead-scraper" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold">
            <ArrowLeft size={20} /> Back to Lead Scraper
          </Link>

          {step === 'messages' && (
            <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h2 className="text-2xl font-bold mb-1">Messages Ready!</h2>
                  <p className="text-gray-600">
                    Personalized for <span className="font-semibold">{selectedLead?.firstName} {selectedLead?.lastName}</span> at <span className="font-semibold">{selectedLead?.company}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {step === 'form' ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <ToneStyleForm onSubmit={handleToneSubmit} isLoading={isLoading} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lead Info Card */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-lg mb-4">Lead Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{selectedLead?.firstName} {selectedLead?.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-semibold">{selectedLead?.company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Title</p>
                  <p className="font-semibold">{selectedLead?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Industry</p>
                  <p className="font-semibold">{selectedLead?.industry}</p>
                </div>
              </div>
            </div>

            {/* Messages Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {messages && (
                <>
                  <ModernMessageCard
                    platform="whatsapp"
                    message={messages.whatsapp}
                    isLoading={regeneratingPlatform === 'whatsapp'}
                    onRegenerate={() => handleRegenerate('whatsapp')}
                  />
                  <ModernMessageCard
                    platform="email"
                    message={messages.email}
                    isLoading={regeneratingPlatform === 'email'}
                    onRegenerate={() => handleRegenerate('email')}
                  />
                  <ModernMessageCard
                    platform="linkedin"
                    message={messages.linkedin}
                    isLoading={regeneratingPlatform === 'linkedin'}
                    onRegenerate={() => handleRegenerate('linkedin')}
                  />
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep('form')}
                className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 rounded-lg font-semibold transition"
              >
                Change Tone
              </button>
              <Link
                href="/dashboard/lead-scraper"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Craft for Another Lead
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
