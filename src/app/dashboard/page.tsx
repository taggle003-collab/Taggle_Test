import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import LiteDashboard from "./components/LiteDashboard";
import SoloDashboard from "./components/SoloDashboard";
import ProDashboard from "./components/ProDashboard";

export default async function DashboardPage() {
  const user = await currentUser();
  const userPlan = await getUserPlan(user?.id || "");

  const plan = userPlan?.plan || "lite"; // Default to lite if no plan

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome, {user?.firstName || "User"}!
        </h1>
        <p className="text-gray-400">
          Email: {user?.emailAddresses[0]?.emailAddress}
        </p>
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