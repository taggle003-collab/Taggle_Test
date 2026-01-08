import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import LiteDashboard from "./components/LiteDashboard";
import SoloDashboard from "./components/SoloDashboard";
import ProDashboard from "./components/ProDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await currentUser();
  const userPlan = await getUserPlan(user?.id || "");
  
  // Await the searchParams promise for Next.js 16
  const params = await searchParams;
  const isAdmin = user?.emailAddresses[0]?.emailAddress === "taggle003@gmail.com";
  const plan = isAdmin ? "pro" : (userPlan?.plan || "lite");

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
            Payment received. We’re activating your plan now — this can take a moment.
          </p>
        </div>
      )}

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