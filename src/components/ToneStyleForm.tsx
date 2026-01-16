'use client';

import React, { useState } from 'react';
import { Wand2, Sparkles } from 'lucide-react';

interface ToneStyleFormProps {
  onSubmit: (data: ToneStyleData) => void;
  isLoading: boolean;
}

export interface ToneStyleData {
  tone: string;
  sampleText: string;
  talkingPoints: string;
}

const TONE_OPTIONS = [
  {
    id: 'professional',
    label: 'Professional',
    description: 'Formal, business-like, serious'
  },
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm, approachable, conversational'
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Relaxed, informal, conversational'
  },
  {
    id: 'sales-focused',
    label: 'Sales-Focused',
    description: 'Direct, benefit-driven, persuasive'
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Unique, innovative, engaging'
  }
];

export default function ToneStyleForm({ onSubmit, isLoading }: ToneStyleFormProps) {
  const [selectedTone, setSelectedTone] = useState('friendly');
  const [sampleText, setSampleText] = useState('');
  const [talkingPoints, setTalkingPoints] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sampleText.trim()) {
      setError('Please write some sample lines so we can understand your tone');
      return;
    }

    if (sampleText.trim().split('.').length < 2) {
      setError('Please provide at least 2-3 sentences as examples');
      return;
    }

    onSubmit({
      tone: selectedTone,
      sampleText: sampleText.trim(),
      talkingPoints: talkingPoints.trim()
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-full">
            <Wand2 className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Craft Your Messages</h2>
        <p className="text-gray-600">
          Tell us your writing style, and we&apos;ll create messages that sound just like you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tone Selection */}
        <div>
          <label className="block text-lg font-semibold mb-4">
            What&apos;s your communication style?
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedTone(option.id)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  selectedTone === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sample Text */}
        <div>
          <label className="block text-lg font-semibold mb-2">
            Write some sample lines
          </label>
          <p className="text-gray-600 text-sm mb-3">
            Share 2-3 sentences you&apos;d typically write. This helps us match your tone and style perfectly.
          </p>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Example: Hi, I noticed your company is doing great work. I think we could help you scale faster. Would love to chat sometime?"
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="text-xs text-gray-500 mt-2">
            {sampleText.split('.').length - 1} sentences ({sampleText.length} characters)
          </div>
        </div>

        {/* Talking Points */}
        <div>
          <label className="block text-lg font-semibold mb-2">
            Key points to mention (optional)
          </label>
          <p className="text-gray-600 text-sm mb-3">
            Any specific benefits or talking points you want included in the messages?
          </p>
          <textarea
            value={talkingPoints}
            onChange={(e) => setTalkingPoints(e.target.value)}
            placeholder="Example: Cost savings, easy implementation, 24/7 support"
            className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin">
                <Sparkles size={20} />
              </div>
              Crafting your messages...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Generate Messages
            </>
          )}
        </button>
      </form>
    </div>
  );
}
