"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Mail, MessageCircle, Share2, Wrench } from "lucide-react";
import UpgradePrompt from "@/components/UpgradePrompt";
import { getFeatureLevel } from "@/lib/feature-access";
import {
  deleteAutomation,
  loadAutomations,
  toggleAutomationActive,
  type Automation,
} from "@/lib/automations";
import AutomationCard from "./AutomationCard";
import AutomationsList from "./AutomationsList";
import Toast, { type ToastMessage } from "./Toast";

const getActiveLimit = (level: "none" | "limited" | "full"): number | null => {
  if (level === "limited") return 5;
  if (level === "full") return null;
  return 0;
};

interface AutomationsHubProps {
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

const AutomationsHub = ({ userPlan: userPlanProp, userEmail: userEmailProp }: AutomationsHubProps) => {
  const router = useRouter();
  const { user } = useUser();

  const userPlan =
    (userPlanProp ?? (user?.unsafeMetadata?.plan as "lite" | "solo" | "pro" | undefined)) ||
    undefined;
  const userEmail = userEmailProp ?? user?.emailAddresses?.[0]?.emailAddress;

  const automationsLevel = getFeatureLevel(userPlan, userEmail, "automations");

  const [automations, setAutomations] = React.useState<Automation[]>([]);
  const [toast, setToast] = React.useState<ToastMessage | null>(null);

  React.useEffect(() => {
    setAutomations(loadAutomations());
  }, []);

  if (automationsLevel === "none") {
    return (
      <UpgradePrompt
        requiredPlan="solo"
        featureName="Automations"
        description="Unlock Automations with Solo plan to activate pre-built workflows for email, WhatsApp, and social media outreach."
      />
    );
  }

  const activeLimit = getActiveLimit(automationsLevel);
  const activeCount = automations.filter((a) => a.isActive).length;
  const limitLabel = activeLimit === null ? "∞" : String(activeLimit);

  const lastCreatedAt = automations
    .map((a) => a.createdAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const latestByType = (type: Automation["type"]) =>
    automations
      .filter((a) => a.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

  const handleToggleActive = (id: string, next: boolean) => {
    if (next && activeLimit !== null) {
      const alreadyActive = automations.filter((a) => a.isActive && a.id !== id).length;
      if (alreadyActive >= activeLimit) {
        setToast({
          type: "error",
          text: `You can only have ${activeLimit} active automations on the Solo plan. Disable one to activate another.`,
        });
        return;
      }
    }

    const nextList = toggleAutomationActive(id, next);
    setAutomations(nextList);
    setToast({ type: "success", text: next ? "Automation activated" : "Automation paused" });
  };

  const handleDelete = (id: string) => {
    const nextList = deleteAutomation(id);
    setAutomations(nextList);
    setToast({ type: "success", text: "Automation deleted" });
  };

  const handleEdit = (automation: Automation) => {
    const base = `/dashboard/automations/${automation.type}`;
    router.push(`${base}?id=${encodeURIComponent(automation.id)}`);
  };

  const getNewHref = (type: Automation["type"]) => `/dashboard/automations/${type}`;

  const getEditHref = (type: Automation["type"]) => {
    const latest = latestByType(type);
    const base = `/dashboard/automations/${type}`;
    return latest ? `${base}?id=${encodeURIComponent(latest.id)}` : undefined;
  };

  const getPrimaryLabel = (type: Automation["type"]) => {
    const latest = latestByType(type);
    return latest ? "Create New" : "Setup";
  };

  const emailAutomation = latestByType("email");
  const whatsappAutomation = latestByType("whatsapp");
  const socialAutomation = latestByType("social");
  const customAutomation = latestByType("custom");

  const isCustomLocked = automationsLevel !== "full";

  return (
    <>
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* Overview */}
      <div className="p-6 bg-black rounded-lg border border-[#FF6B35]/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-white text-lg font-semibold mb-1">Automations Overview</h3>
            <p className="text-gray-400 text-sm">{`${activeCount}/${limitLabel} automations active`}</p>
          </div>
          <div className="text-sm text-gray-400">
            <p>
              Limit: {activeLimit === null ? "Unlimited" : `${activeLimit} active automations`}
            </p>
            <p>
              Last created:{" "}
              {lastCreatedAt ? lastCreatedAt.toLocaleDateString() : "No automations yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div>
        <h3 className="text-white font-semibold mb-3">Pre-built Automations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AutomationCard
            title="Email Automation"
            description="Automatically send follow-ups when a new lead is generated."
            icon={Mail}
            href={getNewHref("email")}
            ctaLabel={getPrimaryLabel("email")}
            secondaryHref={getEditHref("email")}
            secondaryLabel={emailAutomation ? "Edit latest" : undefined}
            badge="Pre-built"
            isActive={emailAutomation?.isActive}
            onToggleActive={
              emailAutomation ? (next) => handleToggleActive(emailAutomation.id, next) : undefined
            }
          />
          <AutomationCard
            title="WhatsApp Automation"
            description="Auto-send WhatsApp messages to leads (integration coming soon)."
            icon={MessageCircle}
            href={getNewHref("whatsapp")}
            ctaLabel={getPrimaryLabel("whatsapp")}
            secondaryHref={getEditHref("whatsapp")}
            secondaryLabel={whatsappAutomation ? "Edit latest" : undefined}
            badge="Pre-built"
            isActive={whatsappAutomation?.isActive}
            onToggleActive={
              whatsappAutomation
                ? (next) => handleToggleActive(whatsappAutomation.id, next)
                : undefined
            }
          />
          <AutomationCard
            title="Social Media Automation"
            description="Queue social outreach to new leads (integration coming soon)."
            icon={Share2}
            href={getNewHref("social")}
            ctaLabel={getPrimaryLabel("social")}
            secondaryHref={getEditHref("social")}
            secondaryLabel={socialAutomation ? "Edit latest" : undefined}
            badge="Pre-built"
            isActive={socialAutomation?.isActive}
            onToggleActive={
              socialAutomation ? (next) => handleToggleActive(socialAutomation.id, next) : undefined
            }
          />
        </div>
      </div>

      {/* Custom Builder */}
      <div>
        <h3 className="text-white font-semibold mb-3">Custom Automation Builder</h3>
        <div className="grid grid-cols-1 gap-4">
          <AutomationCard
            title="Custom Automation"
            description="Build multi-step workflows with advanced triggers and actions."
            icon={Wrench}
            href={getNewHref("custom")}
            ctaLabel={isCustomLocked ? "Upgrade to Pro" : "Create Custom"}
            secondaryHref={!isCustomLocked ? getEditHref("custom") : undefined}
            secondaryLabel={customAutomation && !isCustomLocked ? "Edit latest" : undefined}
            locked={isCustomLocked}
            badge={automationsLevel === "full" ? "Pro" : "Locked"}
            isActive={customAutomation?.isActive}
            onToggleActive={
              customAutomation && !isCustomLocked
                ? (next) => handleToggleActive(customAutomation.id, next)
                : undefined
            }
            toggleDisabled={isCustomLocked}
          />
        </div>
      </div>

      {/* Active list */}
      <AutomationsList
        automations={automations}
        activeLimit={activeLimit}
        onToggleActive={handleToggleActive}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </>
  );
};

export default AutomationsHub;
