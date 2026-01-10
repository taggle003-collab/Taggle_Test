"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import UpgradePrompt from "@/components/UpgradePrompt";
import { getFeatureLevel, hasFeature } from "@/lib/feature-access";
import {
  generateAutomationId,
  getAutomationById,
  loadAutomations,
  type Automation,
  type AutomationTrigger,
  upsertAutomation,
} from "@/lib/automations";
import Toast, { type ToastMessage } from "./Toast";

type PreBuiltType = "email" | "whatsapp" | "social";

type DelayPreset = "immediately" | "1h" | "24h" | "custom_days";

type EmailTemplateType = "welcome" | "follow_up" | "custom";

type WhatsappTemplateType = "intro" | "pitch" | "custom";

type SocialTemplateType = "connection" | "dm" | "custom";

type RecipientType = "lead" | "custom";

type SocialRecipientType = "linkedin_profile" | "social_handle";

const parseJson = <T,>(raw: string | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const getLimit = (level: "limited" | "full") => (level === "limited" ? 5 : null);

interface PreBuiltAutomationFormProps {
  type: PreBuiltType;
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

const PreBuiltAutomationForm = ({ type, userPlan: userPlanProp, userEmail: userEmailProp }: PreBuiltAutomationFormProps) => {
  const router = useRouter();
  const params = useSearchParams();

  const { user } = useUser();
  const userPlan =
    (userPlanProp ?? (user?.unsafeMetadata?.plan as "lite" | "solo" | "pro" | undefined)) ||
    undefined;
  const userEmail = userEmailProp ?? user?.emailAddresses?.[0]?.emailAddress;

  const automationsLevel = getFeatureLevel(userPlan, userEmail, "automations");
  const crmAvailable = hasFeature(userPlan, userEmail, "crmAccess");

  const [toast, setToast] = React.useState<ToastMessage | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const id = params.get("id") ?? undefined;
  const [existing, setExisting] = React.useState<Automation | null>(null);

  const [name, setName] = React.useState("");
  const [trigger, setTrigger] = React.useState<AutomationTrigger>("new_lead");

  const [delayPreset, setDelayPreset] = React.useState<DelayPreset>("immediately");
  const [customDays, setCustomDays] = React.useState<number>(1);

  const [isActive, setIsActive] = React.useState<boolean>(true);

  // Email-only
  const [emailTemplate, setEmailTemplate] = React.useState<EmailTemplateType>("welcome");
  const [customEmailBody, setCustomEmailBody] = React.useState<string>("");
  const [recipientType, setRecipientType] = React.useState<RecipientType>("lead");
  const [customRecipient, setCustomRecipient] = React.useState<string>("");

  // WhatsApp-only
  const [whatsappTemplate, setWhatsappTemplate] = React.useState<WhatsappTemplateType>("intro");
  const [customWhatsappBody, setCustomWhatsappBody] = React.useState<string>("");

  // Social-only
  const [platforms, setPlatforms] = React.useState<string[]>(["linkedin"]);
  const [socialTemplate, setSocialTemplate] = React.useState<SocialTemplateType>("connection");
  const [customSocialBody, setCustomSocialBody] = React.useState<string>("");
  const [socialRecipientType, setSocialRecipientType] = React.useState<SocialRecipientType>(
    "linkedin_profile"
  );

  React.useEffect(() => {
    if (!id) return;
    const found = getAutomationById(id);
    if (!found || found.type !== type) return;

    setExisting(found);
    setName(found.name);
    setTrigger(found.trigger);
    setIsActive(found.isActive);

    const delay = found.sendDelay ?? 0;
    if (delay === 0) {
      setDelayPreset("immediately");
    } else if (delay === 1) {
      setDelayPreset("1h");
    } else if (delay === 24) {
      setDelayPreset("24h");
    } else {
      setDelayPreset("custom_days");
      setCustomDays(Math.max(1, Math.round(delay / 24)));
    }

    if (type === "email") {
      const parsed = parseJson<{
        template: EmailTemplateType;
        customBody?: string;
        recipientType?: RecipientType;
        customRecipient?: string;
      }>(found.template, { template: "welcome" });

      setEmailTemplate(parsed.template);
      setCustomEmailBody(parsed.customBody ?? "");
      setRecipientType(parsed.recipientType ?? "lead");
      setCustomRecipient(parsed.customRecipient ?? "");
    }

    if (type === "whatsapp") {
      const parsed = parseJson<{ template: WhatsappTemplateType; customBody?: string }>(
        found.template,
        { template: "intro" }
      );
      setWhatsappTemplate(parsed.template);
      setCustomWhatsappBody(parsed.customBody ?? "");
    }

    if (type === "social") {
      const parsed = parseJson<{
        platforms: string[];
        template: SocialTemplateType;
        customBody?: string;
        recipientType?: SocialRecipientType;
      }>(found.template, {
        platforms: ["linkedin"],
        template: "connection",
      });

      setPlatforms(parsed.platforms?.length ? parsed.platforms : ["linkedin"]);
      setSocialTemplate(parsed.template);
      setCustomSocialBody(parsed.customBody ?? "");
      setSocialRecipientType(parsed.recipientType ?? "linkedin_profile");
    }
  }, [id, type]);

  if (automationsLevel === "none") {
    return (
      <UpgradePrompt
        requiredPlan="solo"
        featureName="Automations"
        description="Unlock Automations with Solo plan. Create pre-built email, WhatsApp, and social media automations and activate workflows for new leads."
      />
    );
  }

  const level = automationsLevel === "limited" ? "limited" : "full";
  const activeLimit = getLimit(level);

  const allAutomations = loadAutomations();
  const activeCount = allAutomations.filter((a) => a.isActive).length;
  const activeCountExcludingSelf = allAutomations.filter((a) => a.isActive && a.id !== id).length;

  const limitLabel = activeLimit === null ? "∞" : String(activeLimit);

  const sendDelayHours = () => {
    if (delayPreset === "immediately") return 0;
    if (delayPreset === "1h") return 1;
    if (delayPreset === "24h") return 24;
    return Math.max(1, customDays) * 24;
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Automation name is required";
    }

    if (delayPreset === "custom_days" && (!customDays || customDays < 1)) {
      nextErrors.customDays = "Enter a valid number of days";
    }

    if (type === "email") {
      if (trigger === "status_changed" && !crmAvailable) {
        nextErrors.trigger = "Lead status trigger requires CRM access";
      }

      if (emailTemplate === "custom" && !customEmailBody.trim()) {
        nextErrors.customEmailBody = "Custom email content is required";
      }

      if (recipientType === "custom") {
        const email = customRecipient.trim();
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!ok) nextErrors.customRecipient = "Enter a valid recipient email";
      }
    }

    if (type === "whatsapp") {
      if (whatsappTemplate === "custom" && !customWhatsappBody.trim()) {
        nextErrors.customWhatsappBody = "Custom message is required";
      }
    }

    if (type === "social") {
      if (platforms.length === 0) {
        nextErrors.platforms = "Select at least one platform";
      }
      if (socialTemplate === "custom" && !customSocialBody.trim()) {
        nextErrors.customSocialBody = "Custom message is required";
      }
    }

    if (isActive && activeLimit !== null && activeCountExcludingSelf >= activeLimit) {
      nextErrors.isActive = `You can only have ${activeLimit} active automations on the Solo plan.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      setToast({ type: "error", text: "Please fix the errors and try again." });
      return;
    }

    const createdAt = existing?.createdAt ?? new Date();

    const base: Automation = {
      id: existing?.id ?? generateAutomationId(),
      name: name.trim(),
      type,
      trigger,
      sendDelay: sendDelayHours(),
      isActive,
      createdAt,
    };

    if (type === "email") {
      base.template = JSON.stringify({
        template: emailTemplate,
        customBody: customEmailBody,
        recipientType,
        customRecipient,
      });
    }

    if (type === "whatsapp") {
      base.template = JSON.stringify({
        template: whatsappTemplate,
        customBody: customWhatsappBody,
      });
    }

    if (type === "social") {
      base.template = JSON.stringify({
        platforms,
        template: socialTemplate,
        customBody: customSocialBody,
        recipientType: socialRecipientType,
      });
    }

    upsertAutomation(base);

    setToast({
      type: "success",
      text: existing ? "Automation updated" : "Automation created",
    });

    setTimeout(() => router.push("/dashboard/automations"), 450);
  };

  const handleTest = () => {
    if (!name.trim()) {
      setToast({ type: "error", text: "Give your automation a name before testing." });
      return;
    }

    if (type === "email") {
      setToast({
        type: "info",
        text: "Test send simulated. (Email delivery integration coming soon in Automations.)",
      });
      return;
    }

    if (type === "whatsapp") {
      setToast({
        type: "info",
        text: "Test send requires WhatsApp integration. Connect your WhatsApp Business account (coming soon).",
      });
      return;
    }

    setToast({
      type: "info",
      text: "Test send requires social media integration (coming soon).",
    });
  };

  const title =
    type === "email"
      ? "Email Automation"
      : type === "whatsapp"
        ? "WhatsApp Automation"
        : "Social Media Automation";

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      <div className="p-6 bg-black rounded-lg border border-[#FF6B35]/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-white text-xl font-bold mb-1">{title} Setup</h2>
            <p className="text-gray-400 text-sm">{`Active automations: ${activeCount}/${limitLabel}`}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/automations")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Automation name <span className="text-red-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
              placeholder="e.g. New lead follow-up"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Trigger</label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
              disabled={type !== "email"}
            >
              <option value="new_lead">New lead from scraper</option>
              {type === "email" && crmAvailable && (
                <option value="status_changed">Lead status changed</option>
              )}
            </select>
            {type !== "email" && (
              <p className="text-gray-500 text-xs mt-1">Trigger is fixed for this automation.</p>
            )}
            {errors.trigger && <p className="text-red-400 text-sm mt-1">{errors.trigger}</p>}
          </div>

          {/* Templates */}
          {type === "email" && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Email template
              </label>
              <select
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value as EmailTemplateType)}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="welcome">Welcome email</option>
                <option value="follow_up">Quick follow-up</option>
                <option value="custom">Custom email</option>
              </select>

              {emailTemplate === "custom" && (
                <div className="mt-3">
                  <textarea
                    value={customEmailBody}
                    onChange={(e) => setCustomEmailBody(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    placeholder="Write your custom email..."
                  />
                  {errors.customEmailBody && (
                    <p className="text-red-400 text-sm mt-1">{errors.customEmailBody}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {type === "whatsapp" && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Message template
              </label>
              <select
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value as WhatsappTemplateType)}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="intro">Quick intro message</option>
                <option value="pitch">Product pitch</option>
                <option value="custom">Custom message</option>
              </select>

              {whatsappTemplate === "custom" && (
                <div className="mt-3">
                  <textarea
                    value={customWhatsappBody}
                    onChange={(e) => setCustomWhatsappBody(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    placeholder="Write your custom WhatsApp message..."
                  />
                  {errors.customWhatsappBody && (
                    <p className="text-red-400 text-sm mt-1">{errors.customWhatsappBody}</p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-200 mb-2">Recipient</label>
                <input
                  disabled
                  value="Lead phone number"
                  className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-gray-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Requires a phone field in your lead data. WhatsApp integration is coming soon.
                </p>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800">
                <p className="text-gray-300 text-sm font-semibold mb-1">Integration note</p>
                <p className="text-gray-500 text-sm">
                  WhatsApp integration is coming soon. You will be able to connect your WhatsApp
                  Business account to send messages automatically.
                </p>
              </div>
            </div>
          )}

          {type === "social" && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Social platforms
              </label>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "linkedin", label: "LinkedIn" },
                  { key: "twitter", label: "Twitter" },
                  { key: "instagram", label: "Instagram" },
                ].map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-gray-300 text-sm">
                    <input
                      type="checkbox"
                      checked={platforms.includes(p.key)}
                      onChange={(e) => {
                        setPlatforms((prev) => {
                          if (e.target.checked) return Array.from(new Set([...prev, p.key]));
                          return prev.filter((x) => x !== p.key);
                        });
                      }}
                      className="accent-[#FF6B35]"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
              {errors.platforms && <p className="text-red-400 text-sm mt-1">{errors.platforms}</p>}

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Message template
                </label>
                <select
                  value={socialTemplate}
                  onChange={(e) => setSocialTemplate(e.target.value as SocialTemplateType)}
                  className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                >
                  <option value="connection">Connection request with intro</option>
                  <option value="dm">Direct message</option>
                  <option value="custom">Custom message</option>
                </select>

                {socialTemplate === "custom" && (
                  <div className="mt-3">
                    <textarea
                      value={customSocialBody}
                      onChange={(e) => setCustomSocialBody(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                      placeholder="Write your custom social message..."
                    />
                    {errors.customSocialBody && (
                      <p className="text-red-400 text-sm mt-1">{errors.customSocialBody}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-200 mb-2">Recipient</label>
                <select
                  value={socialRecipientType}
                  onChange={(e) =>
                    setSocialRecipientType(e.target.value as SocialRecipientType)
                  }
                  className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                >
                  <option value="linkedin_profile">Lead LinkedIn profile</option>
                  <option value="social_handle">Lead social handle</option>
                </select>
              </div>

              <div className="mt-3 p-3 rounded-lg bg-[#1a1a1a] border border-gray-800">
                <p className="text-gray-300 text-sm font-semibold mb-1">Integration note</p>
                <p className="text-gray-500 text-sm">Social media integration is coming soon.</p>
              </div>
            </div>
          )}

          {/* Recipient (email only) */}
          {type === "email" && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-200 mb-2">Recipient</label>
              <select
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
              >
                <option value="lead">Lead email</option>
                <option value="custom">Custom email</option>
              </select>

              {recipientType === "custom" && (
                <div className="mt-3">
                  <input
                    value={customRecipient}
                    onChange={(e) => setCustomRecipient(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                    placeholder="recipient@company.com"
                  />
                  {errors.customRecipient && (
                    <p className="text-red-400 text-sm mt-1">{errors.customRecipient}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Delay */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">Send delay</label>
            <select
              value={delayPreset}
              onChange={(e) => setDelayPreset(e.target.value as DelayPreset)}
              className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
            >
              <option value="immediately">Immediately</option>
              <option value="1h">1 hour</option>
              <option value="24h">24 hours</option>
              <option value="custom_days">Custom (days)</option>
            </select>

            {delayPreset === "custom_days" && (
              <div className="mt-3">
                <input
                  type="number"
                  min={1}
                  value={customDays}
                  onChange={(e) => setCustomDays(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white focus:border-[#FF6B35] focus:outline-none"
                />
                {errors.customDays && (
                  <p className="text-red-400 text-sm mt-1">{errors.customDays}</p>
                )}
              </div>
            )}
          </div>

          {/* Active */}
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
              <span className="text-gray-300 text-sm">
                {isActive ? "Enabled" : "Disabled"}
              </span>
            </div>
            {errors.isActive && <p className="text-red-400 text-sm mt-1">{errors.isActive}</p>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[44px] bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#e55a2b] transition-colors"
          >
            Save automation
          </button>
          <button
            type="button"
            onClick={handleTest}
            className="flex-1 min-h-[44px] bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Test send
          </button>
        </div>
      </div>
    </>
  );
};

export default PreBuiltAutomationForm;
