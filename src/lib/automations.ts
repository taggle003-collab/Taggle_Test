export type AutomationType = "email" | "whatsapp" | "social" | "custom";

export type AutomationTrigger =
  | "new_lead"
  | "status_changed"
  | "campaign_added"
  | "manual"
  | "custom";

export type ConditionOperator = "equals" | "contains" | "greater_than";

export interface CustomCondition {
  field: string;
  operator: ConditionOperator;
  value: string;
}

export type CustomActionType =
  | "email"
  | "whatsapp"
  | "linkedin"
  | "update_status"
  | "create_task"
  | "webhook";

export interface CustomAction {
  type: CustomActionType;
  template?: string;
  delay?: number;
  conditions?: CustomCondition[];
}

export interface Automation {
  id: string;
  name: string;
  type: AutomationType;
  trigger: AutomationTrigger;
  template?: string;
  sendDelay?: number; // in hours
  isActive: boolean;
  createdAt: Date;
  actions?: CustomAction[];
  conditions?: CustomCondition[];
}

type StoredAutomation = Omit<Automation, "createdAt"> & { createdAt: string };

const STORAGE_KEY = "taggle_automations_v1";

export const generateAutomationId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `auto_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

export const loadAutomations = (): Automation[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StoredAutomation[];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((a): Automation => ({
        ...a,
        createdAt: new Date(a.createdAt),
      }))
      .filter((a) => a.id && a.name && a.type && a.trigger);
  } catch {
    return [];
  }
};

export const saveAutomations = (automations: Automation[]) => {
  if (typeof window === "undefined") return;

  const toStore: StoredAutomation[] = automations.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
};

export const getAutomationById = (id: string): Automation | null => {
  const all = loadAutomations();
  return all.find((a) => a.id === id) ?? null;
};

export const upsertAutomation = (automation: Automation) => {
  const all = loadAutomations();
  const idx = all.findIndex((a) => a.id === automation.id);

  const next = [...all];
  if (idx >= 0) {
    next[idx] = automation;
  } else {
    next.unshift(automation);
  }

  saveAutomations(next);
  return next;
};

export const deleteAutomation = (id: string) => {
  const all = loadAutomations();
  const next = all.filter((a) => a.id !== id);
  saveAutomations(next);
  return next;
};

export const toggleAutomationActive = (id: string, isActive: boolean) => {
  const all = loadAutomations();
  const next = all.map((a) => (a.id === id ? { ...a, isActive } : a));
  saveAutomations(next);
  return next;
};
