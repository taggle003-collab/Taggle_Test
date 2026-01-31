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
    <div className="bg-black border border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Business Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                className="hover:bg-gray-900/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-semibold text-white">{lead.name}</div>
                    {lead.website && (
                      <div className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                        <ExternalLink size={12} className="text-gray-500" />
                        <a 
                          href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#FF6B35] transition-colors"
                        >
                          {lead.website}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#FF6B35]" />
                        <span className="text-sm text-[#FF6B35] font-medium">{lead.email}</span>
                        <button
                          onClick={() => copyToClipboard(lead.email!, 'email-' + lead.id)}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            copiedField === 'email-' + lead.id
                              ? 'bg-green-500/20 text-green-400'
                              : 'text-gray-400 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10'
                          }`}
                          title="Copy email"
                        >
                          {copiedField === 'email-' + lead.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm text-white">{lead.phone}</span>
                        <button
                          onClick={() => copyToClipboard(lead.phone!, 'phone-' + lead.id)}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            copiedField === 'phone-' + lead.id
                              ? 'bg-green-500/20 text-green-400'
                              : 'text-gray-400 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10'
                          }`}
                          title="Copy phone"
                        >
                          {copiedField === 'phone-' + lead.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {lead.city && <div className="font-medium">{lead.city}</div>}
                    <div className="text-gray-400 text-sm">{lead.country}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border border-gray-700/60 text-gray-300 bg-gray-800/30">
                    {lead.businessType || 'Not specified'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {lead.email && (
                      <button
                        onClick={() => copyToClipboard(lead.email!, 'email-btn-' + lead.id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] hover:from-[#FF8B55] hover:to-[#FF6B35] text-white rounded-md text-xs font-medium transition-all duration-300 flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/20"
                      >
                        <Mail size={12} />
                        Copy Email
                      </button>
                    )}
                    {lead.phone && (
                      <button
                        onClick={() => copyToClipboard(lead.phone!, 'phone-btn-' + lead.id)}
                        className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-md text-xs font-medium transition-all duration-300 border border-gray-600/50 flex items-center gap-1.5"
                      >
                        <Phone size={12} />
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