import { DODO_PLANS, getPlanByProductId } from "@/lib/dodo-config";
import { updateUserPlan } from "@/lib/user-plan";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SUCCESS_EVENT_TYPES = new Set([
  "payment.succeeded",
  "subscription.active",
  "subscription.renewed",
  "subscription.updated",
  "subscription.plan_changed",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventType = typeof body?.type === "string" ? body.type : null;
    const data = body?.data ?? body;

    // Backwards compatibility with older webhook shapes
    const legacyStatus = typeof body?.status === "string" ? body.status : null;

    const isSuccessful = eventType
      ? SUCCESS_EVENT_TYPES.has(eventType)
      : legacyStatus
        ? ["completed", "succeeded", "paid"].includes(legacyStatus)
        : false;

    if (!isSuccessful) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const metadata = (data?.metadata ?? data?.customData ?? data?.custom_data ?? {}) as
      | Record<string, unknown>
      | undefined;

    const userIdRaw = metadata?.userId ?? metadata?.user_id;
    const userId = typeof userIdRaw === "string" ? userIdRaw : null;

    if (!userId) {
      console.error("[dodo-webhook] Missing userId in metadata", { eventType, metadata });
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const planKeyRaw = metadata?.planKey ?? metadata?.plan_key;
    const billingCycleRaw = metadata?.billingCycle ?? metadata?.billing_cycle;
    const productIdRaw =
      metadata?.productId ??
      metadata?.product_id ??
      data?.product_id ??
      data?.productId;

    let planKey: "lite" | "solo" | "pro" | null =
      typeof planKeyRaw === "string" && planKeyRaw in DODO_PLANS
        ? (planKeyRaw as "lite" | "solo" | "pro")
        : null;

    let billingCycle: "monthly" | "yearly" | null =
      billingCycleRaw === "monthly" || billingCycleRaw === "yearly"
        ? (billingCycleRaw as "monthly" | "yearly")
        : null;

    let productId = typeof productIdRaw === "string" ? productIdRaw : null;

    if ((!planKey || !billingCycle) && productId) {
      const planInfo = getPlanByProductId(productId);
      if (planInfo) {
        planKey = planKey ?? (planInfo.planKey as "lite" | "solo" | "pro");
        billingCycle =
          billingCycle ?? (planInfo.billingCycle as "monthly" | "yearly");
      }
    }

    if (!planKey) {
      console.error("[dodo-webhook] Could not resolve plan", {
        eventType,
        userId,
        planKeyRaw,
        billingCycleRaw,
        productId,
      });
      return NextResponse.json({ error: "Plan not found" }, { status: 400 });
    }

    const plan = DODO_PLANS[planKey];

    // payment_id (payment events) or subscription_id (subscription events)
    const orderId =
      (typeof data?.payment_id === "string" && data.payment_id) ||
      (typeof data?.subscription_id === "string" && data.subscription_id) ||
      (typeof body?.orderId === "string" && body.orderId) ||
      undefined;

    await updateUserPlan(userId, {
      plan: planKey,
      billingCycle: billingCycle ?? undefined,
      productId: productId ?? undefined,
      orderId,
      purchaseDate: new Date().toISOString(),
      leadsUsed: 0,
      totalLeads: plan.leads,
      dodoEventType: eventType ?? legacyStatus ?? undefined,
    });

    console.log(
      `✅ Plan activated for user ${userId}: ${plan.name}${billingCycle ? ` (${billingCycle})` : ""}`
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[dodo-webhook] error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
