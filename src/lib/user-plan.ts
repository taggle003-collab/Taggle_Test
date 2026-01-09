import { clerkClient } from "@clerk/nextjs/server";
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