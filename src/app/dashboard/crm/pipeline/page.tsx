import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function PipelinePage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const userPlanData = await getUserPlan(user.id);
  const isAdmin = user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL;
  const plan = isAdmin ? "pro" : (userPlanData?.plan || "lite");

  // Lite users see upgrade prompt
  if (plan === "lite") {
    return (
      <div className="py-8">
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">CRM Access Required</h1>
          <p className="text-gray-300 mb-6">
            Pipeline management is available with Solo and Pro plans. Upgrade to track deals through your sales process.
          </p>
          <Link
            href="/#pricing"
            className="inline-block bg-[#FF6B35] text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>
    );
  }

  // Solo users see limited pipeline
  if (plan === "solo") {
    return (
      <div className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pipeline (Limited)</h1>
          <p className="text-gray-400">
            Basic deal tracking. Upgrade to Pro for full pipeline management with kanban board and automation.
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-white mb-2">No deals yet</h2>
            <p className="text-gray-400 mb-6">
              Create deals from your contacts to track them through your sales process.
            </p>
            <Link
              href="/dashboard/crm/contacts"
              className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              View Contacts
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-200">
            💡 Solo Plan: You can create and track basic deals. Upgrade to Pro for kanban board, deal stages, automated workflows, and advanced reporting.
          </p>
        </div>
      </div>
    );
  }

  // Pro users see full pipeline
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Pipeline</h1>
        <p className="text-gray-400">
          Track your deals through the sales process with full kanban board
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {["New", "Contacted", "Interested", "Negotiating", "Won", "Lost"].map((stage) => (
            <div key={stage} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">{stage}</h3>
                <span className="bg-[#FF6B35] text-white text-xs px-2 py-1 rounded">0</span>
              </div>
              <div className="text-gray-400 text-sm text-center py-8">
                No deals
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-green-900/30 border border-green-600 rounded-lg p-6">
        <p className="text-green-200">
          🚀 Pro Plan: Full pipeline management with kanban board, deal values, automated workflows, and detailed analytics.
        </p>
      </div>
    </div>
  );
}
