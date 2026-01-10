import { clerkClient, auth } from "@clerk/nextjs/server";
import { DODO_PLANS } from "./dodo-config";

type PlanType = keyof typeof DODO_PLANS;

export interface UserPlanMetadata {
  plan?: "lite" | "solo" | "pro";
  billingCycle?: "monthly" | "yearly";
  productId?: string;
  orderId?: string;
  purchaseDate?: string;
  trialStartedAt?: string;
  leadsUsed?: number;
  totalLeads?: number;
  [key: string]: unknown;
}

export async function updateUserPlan(
  userId: string,
  planData: UserPlanMetadata
) {
  try {
    const client = await clerkClient();

    await client.users.updateUser(userId, {
      unsafeMetadata: planData,
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    throw error;
  }
}

export async function getUserPlan(
  userId: string
): Promise<UserPlanMetadata | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return (user.unsafeMetadata as UserPlanMetadata) || null;
  } catch (error) {
    console.error("Error getting user plan:", error);
    return null;
  }
}

// Server-side helper to get current user plan without requiring userId
export async function getCurrentUserPlan(): Promise<"lite" | "solo" | "pro" | null> {
  try {
    const authResult = await auth();
    if (!authResult?.userId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(authResult.userId);
    const metadata = user.unsafeMetadata as UserPlanMetadata;

    if (metadata.plan === 'lite' || metadata.plan === 'solo' || metadata.plan === 'pro') {
      return metadata.plan;
    }
    return null;
  } catch (error) {
    console.error("Error getting current user plan:", error);
    return null;
  }
}

// Server-side helper to get current user email without requiring userId
export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const authResult = await auth();
    if (!authResult?.userId) return null;

    const client = await clerkClient();
    const user = await client.users.getUser(authResult.userId);
    return user.emailAddresses?.[0]?.emailAddress || null;
  } catch (error) {
    console.error("Error getting current user email:", error);
    return null;
  }
}

// Client-side helper - reads from localStorage (must be set by server components)
export function getUserPlanFromStorage(): "lite" | "solo" | "pro" | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('taggle_user_plan');
    if (stored === 'lite' || stored === 'solo' || stored === 'pro') {
      return stored;
    }
    return null;
  } catch (error) {
    console.error("Error getting user plan from storage:", error);
    return null;
  }
}

// Client-side helper - reads from localStorage (must be set by server components)
export function getUserEmailFromStorage(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('taggle_user_email');
    return stored || null;
  } catch (error) {
    console.error("Error getting user email from storage:", error);
    return null;
  }
}

// Helper to save user plan and email to localStorage (for client-side access)
export function saveUserToLocalStorage(plan: string | null, email: string | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (plan && (plan === 'lite' || plan === 'solo' || plan === 'pro')) {
      localStorage.setItem('taggle_user_plan', plan);
    }
    if (email) {
      localStorage.setItem('taggle_user_email', email);
    }
  } catch (error) {
    console.error("Error saving user to storage:", error);
  }
}
