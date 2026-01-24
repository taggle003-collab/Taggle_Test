'use client';

import React, { useState } from 'react';
import { Copy, Mail, Phone, ExternalLink } from 'lucide-react';
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
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B35] mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading leads...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return null; // This should be handled by the parent component
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Business Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-800/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-white">{lead.name}</div>
                    {lead.website && (
                      <div className="text-sm text-gray-400 flex items-center gap-1">
                        <ExternalLink size={12} />
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
                  <div className="space-y-1">
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-sm text-white">{lead.email}</span>
                        <button
                          onClick={() => copyToClipboard(lead.email!, 'email-' + lead.id)}
                          className="p-1 text-gray-400 hover:text-[#FF6B35] transition-colors"
                          title="Copy email"
                        >
                          <Copy size={12} />
                        </button>
                        {copiedField === 'email-' + lead.id && (
                          <span className="text-xs text-green-400">Copied!</span>
                        )}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm text-white">{lead.phone}</span>
                        <button
                          onClick={() => copyToClipboard(lead.phone!, 'phone-' + lead.id)}
                          className="p-1 text-gray-400 hover:text-[#FF6B35] transition-colors"
                          title="Copy phone"
                        >
                          <Copy size={12} />
                        </button>
                        {copiedField === 'phone-' + lead.id && (
                          <span className="text-xs text-green-400">Copied!</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {lead.city && <div>{lead.city}</div>}
                    <div className="text-gray-400">{lead.country}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white">
                    {lead.businessType || 'Not specified'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {lead.email && (
                      <button
                        onClick={() => copyToClipboard(lead.email!, 'email-btn-' + lead.id)}
                        className="px-3 py-1 bg-[#FF6B35] text-white rounded text-xs hover:bg-[#e55a2b] transition-colors flex items-center gap-1"
                      >
                        <Mail size={12} />
                        Copy Email
                      </button>
                    )}
                    {lead.phone && (
                      <button
                        onClick={() => copyToClipboard(lead.phone!, 'phone-btn-' + lead.id)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 transition-colors flex items-center gap-1"
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