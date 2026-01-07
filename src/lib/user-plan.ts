import { clerkClient } from "@clerk/nextjs/server";

export interface UserPlanMetadata {
  plan?: "lite" | "solo" | "pro";
  billingCycle?: "monthly" | "yearly";
  productId?: string;
  orderId?: string;
  purchaseDate?: string;
  leadsUsed?: number;
  totalLeads?: number;
}

export async function updateUserPlan(
  userId: string,
  planData: UserPlanMetadata
) {
  try {
    await clerkClient.users.updateUser(userId, {
      unsafeMetadata: planData,
    });
  } catch (error) {
    console.error("Error updating user plan:", error);
    throw error;
  }
}

export async function getUserPlan(userId: string): Promise<UserPlanMetadata | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    return (user.unsafeMetadata as UserPlanMetadata) || null;
  } catch (error) {
    console.error("Error getting user plan:", error);
    return null;
  }
}