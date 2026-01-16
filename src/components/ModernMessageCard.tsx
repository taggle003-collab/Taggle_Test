'use client';

import React, { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface ModernMessageCardProps {
  platform: 'whatsapp' | 'email' | 'linkedin';
  message: string;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

const PLATFORM_CONFIG = {
  whatsapp: {
    icon: '💬',
    name: 'WhatsApp',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    accentColor: 'text-green-600',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  },
  email: {
    icon: '📧',
    name: 'Email',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    accentColor: 'text-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  },
  linkedin: {
    icon: '💼',
    name: 'LinkedIn / Social',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    accentColor: 'text-purple-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-700'
  }
};

export default function ModernMessageCard({
  platform,
  message,
  isLoading,
  onRegenerate
}: ModernMessageCardProps) {
  const [copied, setCopied] = useState(false);
  const config = PLATFORM_CONFIG[platform];

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border-2 ${config.borderColor} ${config.bgColor} rounded-xl overflow-hidden`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.color} px-6 py-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <h3 className="text-xl font-bold">{config.name}</h3>
          </div>
          {isLoading && (
            <div className="animate-spin">
              <RefreshCw size={20} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin mb-2">
                <RefreshCw size={24} className={config.accentColor} />
              </div>
              <p className="text-gray-600">Crafting message...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 min-h-24">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {message}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className={`flex-1 ${config.buttonColor} text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2`}
              >
                {copied ? (
                  <>
                    <Check size={18} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} /> Copy Message
                  </>
                )}
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="px-4 py-2 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Regenerate
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
