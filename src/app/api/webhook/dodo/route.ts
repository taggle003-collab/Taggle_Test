import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateUserPlan } from "@/lib/user-plan";
import { getPlanByProductId } from "@/lib/dodo-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature (if Dodo provides one)
    // For now, we'll trust the webhook from Dodo's secure servers
    
    const { status, productId, customData, orderId } = body;
    
    // Only process successful payments
    if (status !== "completed" && status !== "succeeded" && status !== "paid") {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    const userId = customData?.userId;
    if (!userId) {
      console.error("No userId in webhook data");
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }
    
    // Get plan info from product ID
    const planInfo = getPlanByProductId(productId);
    if (!planInfo) {
      console.error(`No plan found for product ID: ${productId}`);
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 400 }
      );
    }
    
    // Update user's plan in Clerk
    await updateUserPlan(userId, {
      plan: planInfo.planKey as "lite" | "solo" | "pro",
      billingCycle: planInfo.billingCycle as "monthly" | "yearly",
      productId,
      orderId,
      purchaseDate: new Date().toISOString(),
      leadsUsed: 0,
      totalLeads: planInfo.leads,
    });
    
    console.log(`✅ Plan activated for user ${userId}: ${planInfo.name} (${planInfo.billingCycle})`);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}