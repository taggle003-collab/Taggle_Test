import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan, updateUserPlan } from "@/lib/user-plan";
import { hasFeature, getFeatureLevel, getLeadsLimit } from "@/lib/feature-access";
import { redirect } from "next/navigation";
import LiteDashboard from "./components/LiteDashboard";
import SoloDashboard from "./components/SoloDashboard";
import ProDashboard from "./components/ProDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  let userPlan = await getUserPlan(user.id);

  // Initialize trial for new users without a plan
  if (!userPlan?.plan && !userPlan?.trialStartedAt) {
    await updateUserPlan(user.id, {
      plan: "lite",
      trialStartedAt: new Date().toISOString(),
      leadsUsed: 0,
      totalLeads: 100
    });
    userPlan = await getUserPlan(user.id);
  }

  // Await searchParams promise for Next.js 16
  const params = await searchParams;
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = userEmail === "taggle003@gmail.com";
  const plan = isAdmin ? "pro" : (userPlan?.plan || "lite") as "lite" | "solo" | "pro";

  const canScrape = hasFeature(plan, userEmail, "leadScraping");
  const crmLevel = getFeatureLevel(plan, userEmail, "crmIntegrations");
  const hasNotifications = hasFeature(plan, userEmail, "realtimeNotifications");
  const analyticsLevel = getFeatureLevel(plan, userEmail, "advancedAnalytics");
  const leadsLimit = getLeadsLimit(plan, userEmail);

  // Calculate trial remaining days
  let trialDaysLeft = null;
  if (userPlan?.trialStartedAt && plan === "lite") {
    const start = new Date(userPlan.trialStartedAt);
    const now = new Date();
    const diffTime = 7 * 24 * 60 * 60 * 1000 - (now.getTime() - start.getTime());
    trialDaysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="py-8">
      {/* Payment Status Banner */}
      {params.payment === "success" && (
        <div className="bg-green-600 text-white px-4 py-3 rounded-lg mb-8">
          <p className="font-semibold">✓ Payment successful! Your plan is now active.</p>
        </div>
      )}

      {params.payment === "return" && (
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg mb-8">
          <p className="font-semibold">
            Payment received. We're activating your plan now — this can take a moment.
          </p>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user?.firstName || "User"}!
          </h1>
          <p className="text-gray-400">
            Email: {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>

        {trialDaysLeft !== null && (
          <div className="bg-orange-600/20 border border-orange-600 text-orange-500 px-4 py-2 rounded-full text-sm font-semibold">
            ⚡️ Free Trial: {trialDaysLeft} days remaining
          </div>
        )}
      </div>

      {/* Render Plan-Specific Dashboard */}
      {plan === "lite" && <LiteDashboard />}
      {plan === "solo" && <SoloDashboard />}
      {plan === "pro" && <ProDashboard />}

      {/* Upgrade CTA */}
      {plan !== "pro" && (
        <div className="mt-12 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Ready for More?</h3>
          <p className="text-orange-100 mb-6">
            Upgrade your plan to unlock more leads and powerful features.
          </p>
          <a href="/#pricing" className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            View All Plans
          </a>
        </div>
      )}
    </div>
  );
}
