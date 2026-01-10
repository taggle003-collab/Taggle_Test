"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import UpgradePrompt from "@/components/UpgradePrompt";
import { getFeatureLevel } from "@/lib/feature-access";
import {
  generateAutomationId,
  getAutomationById,
  loadAutomations,
  type Automation,
  type AutomationTrigger,
  type CustomAction,
  type CustomActionType,
  type CustomCondition,
  upsertAutomation,
} from "@/lib/automations";
import Toast, { type ToastMessage } from "./Toast";

const triggerOptions: { value: AutomationTrigger; label: string }[] = [
  { value: "new_lead", label: "New lead from scraper" },
  { value: "status_changed", label: "Lead status changed" },
  { value: "campaign_added", label: "Lead added to campaign" },
  { value: "manual", label: "Manual trigger" },
];

const actionOptions: { value: CustomActionType; label: string }[] = [
  { value: "email", label: "Send email" },
  { value: "whatsapp", label: "Send WhatsApp" },
  { value: "linkedin", label: "Send LinkedIn message" },
  { value: "update_status", label: "Update lead status" },
  { value: "create_task", label: "Create CRM task" },
  { value: "webhook", label: "Webhook call" },
];

const conditionFields = [
  { value: "industry", label: "Industry" },
  { value: "companySize", label: "Company size" },
  { value: "location", label: "Location" },
  { value: "title", label: "Job title" },
];

interface CustomAutomationBuilderProps {
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

const CustomAutomationBuilder = ({
  userPlan: userPlanProp,
  userEmail: userEmailProp,
}: CustomAutomationBuilderProps) => {
  const router = useRouter();
  const params = useSearchParams();

  const { user } = useUser();
  const userPlan =
    (userPlanProp ?? (user?.unsafeMetadata?.plan as "lite" | "solo" | "pro" | undefined)) ||
    undefined;
  const userEmail = userEmailProp ?? user?.emailAddresses?.[0]?.emailAddress;

  const automationsLevel = getFeatureLevel(userPlan, userEmail, "automations");

  const [toast, setToast] = React.useState<ToastMessage | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const id = params.get("id") ?? undefined;
  const [existing, setExisting] = React.useState<Automation | null>(null);

  const [name, setName] = React.useState<string>("");
  const [trigger, setTrigger] = React.useState<AutomationTrigger>("new_lead");
  const [isActive, setIsActive] = React.useState<boolean>(true);

  const [conditions, setConditions] = React.useState<CustomCondition[]>([]);
  const [actions, setActions] = React.useState<CustomAction[]>([
    { type: "email", template: "", delay: 0 },
  ]);

  React.useEffect(() => {
    if (!id) return;
    const found = getAutomationById(id);
    if (!found || found.type !== "custom") return;

    setExisting(found);
    setName(found.name);
    setTrigger(found.trigger);
    setIsActive(found.isActive);
    setConditions(found.conditions ?? []);
    setActions(found.actions?.length ? found.actions : [{ type: "email", template: "", delay: 0 }]);
  }, [id]);

  if (automationsLevel !== "full") {
    return (
      <UpgradePrompt
        requiredPlan="pro"
        featureName="Custom Automation Builder"
        description="Upgrade to Pro to create unlimited custom automations with advanced triggers, conditions, and multi-step actions."
      />
    );
  }

  const activeCount = loadAutomations().filter((a) => a.isActive).length;

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = "Automation name is required";

    if (!trigger) nextErrors.trigger = "Select a trigger";

    if (!actions.length) {
      nextErrors.actions = "Add at least one action";
    } else {
      actions.forEach((a, idx) => {
        if ((a.type === "email" || a.type === "whatsapp" || a.type === "linkedin") && !a.template?.trim()) {
          nextErrors[`action_template_${idx}`] = "Message/template is required";
        }
        if (a.type === "webhook" && (!a.template?.trim() || !/^https?:\/\//.test(a.template.trim()))) {
          nextErrors[`action_template_${idx}`] = "Enter a valid webhook URL";
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      setToast({ type: "error", text: "Please fix the errors and try again." });
      return;
    }

    const automation: Automation = {
      id: existing?.id ?? generateAutomationId(),
      name: name.trim(),
      type: "custom",
      trigger,
      isActive,
      createdAt: existing?.createdAt ?? new Date(),
      actions: actions.map((a) => ({
        ...a,
        delay: a.delay ? Number(a.delay) : 0,
      })),
      conditions,
    };

    upsertAutomation(automation);

    setToast({ type: "success", text: existing ? "Automation updated" : "Automation created" });
    setTimeout(() => router.push("/dashboard/automations"), 450);
  };

  const handleTest = () => {
    setToast({ type: "info", text: "Test trigger simulated. Actions would execute in production." });
  };

  const addCondition = () => {
    setConditions((prev) => [...prev, { field: "industry", operator: "equals", value: "" }]);
  };

  const removeCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAction = () => {
    setActions((prev) => [...prev, { type: "email", template: "", delay: 0 }]);
  };

  const removeAction = (idx: number) => {
    setActions((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className="p-6 bg-black rounded-lg border border-[#FF6B35]/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white text-xl font-bold mb-1">Custom Automation Builder</h2>
            <p className="text-gray-400 text-sm">Unlimited active automations • Active now: {activeCount}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/automations")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Automation name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
              placeholder="e.g. Multi-step outreach"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Trigger</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
            >
              {triggerOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.trigger && <p className="text-red-400 text-sm mt-1">{errors.trigger}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Active</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-[#FF6B35]" : "bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-gray-300 text-sm">{isActive ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-white font-semibold">Conditions (optional)</h3>
            <button
              type="button"
              onClick={addCondition}
              className="min-h-[44px] px-4 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              Add condition
            </button>
          </div>

          {conditions.length === 0 ? (
            <p className="text-gray-500 text-sm">No conditions. This automation will run for all leads.</p>
          ) : (
            <div className="space-y-3">
              {conditions.map((c, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 lg:grid-cols-4 gap-3 p-4 rounded-lg bg-[#1a1a1a] border border-gray-800"
                >
                  <select
                    value={c.field}
                    onChange={(e) =>
                      setConditions((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, field: e.target.value } : x))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                  >
                    {conditionFields.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={c.operator}
                    onChange={(e) =>
                      setConditions((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? { ...x, operator: e.target.value as CustomCondition["operator"] }
                            : x
                        )
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                  >
                    <option value="equals">Equals</option>
                    <option value="contains">Contains</option>
                    <option value="greater_than">Greater than</option>
                  </select>

                  <input
                    value={c.value}
                    onChange={(e) =>
                      setConditions((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x))
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-black border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    placeholder="Value"
                  />

                  <button
                    type="button"
                    onClick={() => removeCondition(idx)}
                    className="min-h-[44px] px-4 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h3 className="text-white font-semibold">Actions</h3>
            <button
              type="button"
              onClick={addAction}
              className="min-h-[44px] px-4 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
            >
              Add action
            </button>
          </div>

          {errors.actions && <p className="text-red-400 text-sm mb-2">{errors.actions}</p>}

          <div className="space-y-3">
            {actions.map((a, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-[#1a1a1a] border border-gray-800"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">Type</label>
                    <select
                      value={a.type}
                      onChange={(e) =>
                        setActions((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, type: e.target.value as CustomActionType } : x
                          )
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    >
                      {actionOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Delay (hours)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={a.delay ?? 0}
                      onChange={(e) =>
                        setActions((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, delay: Number(e.target.value) } : x))
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeAction(idx)}
                      className="w-full min-h-[44px] px-4 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">
                    {a.type === "webhook" ? "Webhook URL" : "Template / message"}
                    {(a.type === "email" || a.type === "whatsapp" || a.type === "linkedin" || a.type === "webhook") && (
                      <span className="text-red-400"> *</span>
                    )}
                  </label>
                  <textarea
                    value={a.template ?? ""}
                    onChange={(e) =>
                      setActions((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, template: e.target.value } : x))
                      )
                    }
                    rows={a.type === "webhook" ? 2 : 4}
                    className="w-full px-3 py-2 rounded-lg bg-black border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    placeholder={
                      a.type === "webhook"
                        ? "https://example.com/webhook"
                        : "Write a message or choose a template..."
                    }
                  />
                  {errors[`action_template_${idx}`] && (
                    <p className="text-red-400 text-sm mt-1">{errors[`action_template_${idx}`]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[44px] bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#e55a2b] transition-colors"
          >
            Save & activate
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="flex-1 min-h-[44px] bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Test trigger
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomAutomationBuilder;
