"use client";

import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Automation } from "@/lib/automations";
import { cn } from "@/lib/utils";

interface AutomationsListProps {
  automations: Automation[];
  activeLimit: number | null;
  onToggleActive: (id: string, next: boolean) => void;
  onEdit: (automation: Automation) => void;
  onDelete: (id: string) => void;
}

const typeLabel: Record<Automation["type"], string> = {
  email: "Email",
  whatsapp: "WhatsApp",
  social: "Social",
  custom: "Custom",
};

const triggerLabel: Record<Automation["trigger"], string> = {
  new_lead: "New lead",
  status_changed: "Status changed",
  campaign_added: "Added to campaign",
  manual: "Manual",
  custom: "Custom",
};

const AutomationsList = ({
  automations,
  activeLimit,
  onToggleActive,
  onEdit,
  onDelete,
}: AutomationsListProps) => {
  const activeCount = automations.filter((a) => a.isActive).length;

  if (automations.length === 0) {
    return (
      <div className="p-8 bg-black rounded-lg border border-[#FF6B35]/20 text-center">
        <p className="text-white font-semibold mb-1">No automations yet</p>
        <p className="text-gray-400 text-sm">
          Create your first automation using the templates above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg border border-[#FF6B35]/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#FF6B35]/10">
        <div>
          <h3 className="text-white font-semibold">Active Automations</h3>
          <p className="text-gray-400 text-sm">
            {activeLimit === null
              ? `${activeCount}/∞ automations active`
              : `${activeCount}/${activeLimit} automations active`}
          </p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <table className="w-full">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Trigger</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {automations.map((a) => (
              <tr key={a.id} className="border-t border-[#FF6B35]/10">
                <td className="px-4 py-3 text-sm text-white font-medium">{a.name}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{typeLabel[a.type]}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{triggerLabel[a.trigger]}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={a.isActive}
                    onClick={() => onToggleActive(a.id, !a.isActive)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      a.isActive ? "bg-[#FF6B35]" : "bg-gray-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        a.isActive ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(a)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gray-900 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      aria-label={`Edit automation ${a.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(a.id)}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                      aria-label={`Delete automation ${a.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden divide-y divide-[#FF6B35]/10">
        {automations.map((a) => (
          <div key={a.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-semibold">{a.name}</p>
                <p className="text-gray-400 text-sm">
                  {typeLabel[a.type]} • {triggerLabel[a.trigger]}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={a.isActive}
                onClick={() => onToggleActive(a.id, !a.isActive)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  a.isActive ? "bg-[#FF6B35]" : "bg-gray-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    a.isActive ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-lg bg-gray-900 text-gray-200 hover:bg-gray-800 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(a.id)}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutomationsList;
