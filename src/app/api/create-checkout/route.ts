import { DODO_PLANS, getPlanByProductId } from "@/lib/dodo-config";
import { createDodoCheckoutSession } from "@/lib/dodo-payment";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type BillingCycle = "monthly" | "yearly";

// Store pending orders temporarily (in production, use a database)
const pendingOrders = new Map<string, any>();

function isBillingCycle(value: unknown): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body", requestId },
        { status: 400 }
      );
    }

    const {
      userEmail,
      userId,
      planKey,
      billingCycle,
      planName,
      productId: rawProductId,
    } = body as Record<string, unknown>;

    if (typeof userEmail !== "string" || typeof userId !== "string") {
      return NextResponse.json(
        { error: "Missing required fields", requestId },
        { status: 400 }
      );
    }

    let productId: string | null = null;
    let resolvedPlanKey: string | null = null;
    let resolvedBillingCycle: BillingCycle | null = null;

    if (typeof planKey === "string" && planKey in DODO_PLANS && isBillingCycle(billingCycle)) {
      const plan = DODO_PLANS[planKey as keyof typeof DODO_PLANS];
      productId = billingCycle === "monthly" ? plan.monthlyProductId : plan.yearlyProductId;
      resolvedPlanKey = planKey;
      resolvedBillingCycle = billingCycle;
    } else if (typeof rawProductId === "string") {
      productId = rawProductId;
      const planInfo = getPlanByProductId(rawProductId);
      if (planInfo) {
        resolvedPlanKey = planInfo.planKey;
        resolvedBillingCycle = planInfo.billingCycle as BillingCycle;
      }
    }

    if (!productId) {
      return NextResponse.json(
        { error: "Missing plan/billing or productId", requestId },
        { status: 400 }
      );
    }

    console.info("[create-checkout] request", {
      requestId,
      userId,
      planKey: resolvedPlanKey ?? planKey,
      billingCycle: resolvedBillingCycle ?? billingCycle,
      productId,
    });

    const metadata: Record<string, unknown> = {};

    const planKeyForMetadata = resolvedPlanKey ?? (typeof planKey === "string" ? planKey : null);
    if (planKeyForMetadata) metadata.planKey = planKeyForMetadata;

    const billingForMetadata = resolvedBillingCycle ?? (isBillingCycle(billingCycle) ? billingCycle : null);
    if (billingForMetadata) metadata.billingCycle = billingForMetadata;

    if (typeof planName === "string") metadata.planName = planName;

    metadata.productId = productId;

    const session = await createDodoCheckoutSession({
      productId,
      userEmail,
      userId,
      metadata,
    });

    // Store pending order info (you should use a database for production)
    pendingOrders.set(session.sessionId, {
      userId,
      userEmail,
      productId,
      planKey: resolvedPlanKey ?? null,
      billingCycle: resolvedBillingCycle ?? null,
      planName: typeof planName === "string" ? planName : null,
      createdAt: new Date(),
    });

    // Cleanup old pending orders (older than 24 hours)
    const now = Date.now();
    for (const [key, value] of pendingOrders.entries()) {
      if (now - value.createdAt.getTime() > 24 * 60 * 60 * 1000) {
        pendingOrders.delete(key);
      }
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
      requestId,
    });
  } catch (error) {
    const status = typeof (error as any)?.status === "number" ? (error as any).status : 500;

    console.error("[create-checkout] error", {
      requestId,
      status,
      message: error instanceof Error ? error.message : String(error),
      details: (error as any)?.details,
    });

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
        requestId,
      },
      { status }
    );
  }
}

// Export for testing
export { pendingOrders };
