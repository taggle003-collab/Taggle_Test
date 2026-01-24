"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { Lead } from "@/lib/supabase-client";

interface LeadsTableProps {
  leads: Lead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const copyToClipboard = async (text: string, type: "email" | "phone", id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        setCopiedEmail(id);
        setTimeout(() => setCopiedEmail(null), 2000);
      } else {
        setCopiedPhone(id);
        setTimeout(() => setCopiedPhone(null), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No leads found
        </h3>
        <p className="text-gray-400">
          Try adjusting your filters or import leads via Supabase dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg p-4">
        <p className="text-gray-300">
          Showing <span className="font-semibold text-[#FF6B35]">{leads.length}</span> lead{leads.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-[#2a2a2a] border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">Email</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">Phone</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">Website</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">City</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">Country</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-300">Business Type</th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1a1a]">
            {leads.map((lead, index) => (
              <tr
                key={lead.id}
                className={`${
                  index !== leads.length - 1 ? "border-b border-gray-800" : ""
                } hover:bg-[#2a2a2a] transition-colors`}
              >
                <td className="px-6 py-4 text-white">{lead.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">{lead.email || "-"}</span>
                    {lead.email && (
                      <button
                        onClick={() => copyToClipboard(lead.email!, "email", lead.id)}
                        className="text-gray-400 hover:text-[#FF6B35] transition"
                        title="Copy email"
                      >
                        {copiedEmail === lead.id ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">{lead.phone || "-"}</span>
                    {lead.phone && (
                      <button
                        onClick={() => copyToClipboard(lead.phone!, "phone", lead.id)}
                        className="text-gray-400 hover:text-[#FF6B35] transition"
                        title="Copy phone"
                      >
                        {copiedPhone === lead.id ? (
                          <Check size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FF6B35] hover:underline"
                    >
                      Visit
                    </a>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-300">{lead.city || "-"}</td>
                <td className="px-6 py-4 text-gray-300">{lead.country}</td>
                <td className="px-6 py-4 text-gray-300">{lead.businessType || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
