import { clerkClient } from "@clerk/nextjs/server";

export interface UserPlanMetadata {
  // Plan and billing fields
  plan?: "lite" | "solo" | "pro";
  billingCycle?: "monthly" | "yearly";
  productId?: string;
  orderId?: string;
  purchaseDate?: string;
  trialStartedAt?: string;
  
  // Lead tracking fields
  leadsUsed?: number;
  totalLeads?: number;
  
  // Rate limiting fields
  searchCount?: number;
  lastSearchTime?: string;
  previousLeads?: string[];
  rateLimitResetTime?: string | null;
  
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

// Client-side function to get plan from user metadata
export function getUserPlanClient(): "lite" | "solo" | "pro" {
  if (typeof window === 'undefined') return 'lite';

  try {
    // Check if there's a user object from Clerk
    const clerkUser = (window as { Clerk?: { user?: { unsafeMetadata?: { plan?: string } } } }).Clerk?.user;
    if (clerkUser?.unsafeMetadata?.plan) {
      return clerkUser.unsafeMetadata.plan as "lite" | "solo" | "pro";
    }
  } catch (error) {
    console.error('Error getting client plan:', error);
  }

  // Default to lite
  return 'lite';
}

export function getUserEmail(): string | undefined {
  // This is a placeholder for client-side email access
  // In client components, you should use Clerk hooks like useUser()
  // This returns undefined to indicate the caller should get email from user context
  return undefined;
}