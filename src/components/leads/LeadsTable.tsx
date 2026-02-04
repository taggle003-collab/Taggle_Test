'use client';

import React, { useState } from 'react';
import { Copy, Mail, Phone, ExternalLink, Check } from 'lucide-react';
import { Lead } from '@/lib/supabase-client';

interface LeadsTableProps {
  leads: Lead[];
  loading?: boolean;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ leads, loading }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-black border border-gray-800 rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-black via-gray-900/20 to-black border border-gray-800/60 rounded-xl overflow-hidden shadow-2xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-900/80 via-gray-900/90 to-gray-900/80 border-b border-gray-800/60 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-5 text-left text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-5 text-left text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
                Communication
              </th>
              <th className="px-6 py-5 text-left text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-5 text-left text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-5 text-left text-xs font-bold text-[#FF6B35] uppercase tracking-wider">
                Quick Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-gradient-to-r hover:from-gray-900/30 hover:to-[#FF6B35]/5 transition-all duration-300 hover:shadow-lg"
              >
                <td className="px-6 py-5 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#FF6B35] transition-colors duration-300">{lead.name}</div>
                    <div className="text-xs text-gray-400 mt-1 font-medium">{'Contact'}</div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="space-y-3">
                    {lead.email && (
                      <div className="flex items-center gap-3 bg-gradient-to-r from-[#FF6B35]/15 to-[#FF6B35]/10 border border-[#FF6B35]/40 rounded-lg p-3 shadow-lg shadow-[#FF6B35]/10">
                        <Mail size={16} className="text-[#FF6B35] drop-shadow-sm" />
                        <span className="text-sm text-[#FF6B35] font-bold break-all">{lead.email}</span>
                        <button
                          onClick={() => copyToClipboard(lead.email!, 'email-' + lead.id)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            copiedField === 'email-' + lead.id
                              ? 'bg-green-500/30 text-green-400 border border-green-500/50 shadow-lg'
                              : 'text-gray-400 hover:text-[#FF6B35] hover:bg-[#FF6B35]/20 hover:scale-110'
                          }`}
                          title="Copy email"
                        >
                          {copiedField === 'email-' + lead.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-3 bg-gray-800/30 border border-gray-700/50 rounded-lg p-3">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm text-white font-medium">{lead.phone}</span>
                        <button
                          onClick={() => copyToClipboard(lead.phone!, 'phone-' + lead.id)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            copiedField === 'phone-' + lead.id
                              ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                              : 'text-gray-400 hover:text-[#FF6B35] hover:bg-[#FF6B35]/20 hover:scale-110'
                          }`}
                          title="Copy phone"
                        >
                          {copiedField === 'phone-' + lead.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm">
                    {lead.city && <div className="text-white font-semibold">{lead.city}</div>}
                    <div className="text-gray-400 text-sm font-medium">{lead.country}</div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="space-y-2">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border border-[#FF6B35]/30 text-[#FF6B35] bg-[#FF6B35]/10 backdrop-blur-sm">
                      {lead.businessType || 'Business'}
                    </span>
                    {lead.website && (
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <ExternalLink size={12} className="text-gray-500" />
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#FF6B35] transition-colors truncate font-medium"
                        >
                          {lead.website}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {lead.email && (
                      <button
                        onClick={() => copyToClipboard(lead.email!, 'email-btn-' + lead.id)}
                        className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] hover:from-[#FF8B55] hover:to-[#FF6B35] text-white rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-[#FF6B35]/25 hover:shadow-[#FF6B35]/40 hover:scale-105"
                      >
                        <Mail size={14} />
                        Copy Email
                      </button>
                    )}
                    {lead.phone && (
                      <button
                        onClick={() => copyToClipboard(lead.phone!, 'phone-btn-' + lead.id)}
                        className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg text-xs font-bold transition-all duration-300 border border-gray-600/50 flex items-center gap-2 hover:border-[#FF6B35]/50 hover:text-[#FF6B35]"
                      >
                        <Phone size={14} />
                        Copy Phone
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsTable;