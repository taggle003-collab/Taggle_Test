import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function ActivitiesPage() {
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
            Activity tracking is available with Solo and Pro plans. Upgrade to log calls, emails, and meetings.
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

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Activities</h1>
        <p className="text-gray-400">
          Track all your interactions with contacts - calls, emails, meetings, and notes
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-white mb-2">No activities yet</h2>
          <p className="text-gray-400 mb-6">
            Start by contacting leads from your contact list. Log your interactions here.
          </p>
          <Link
            href="/dashboard/crm/contacts"
            className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            View Contacts
          </Link>
        </div>
      </div>

      {plan === "solo" && (
        <div className="mt-8 bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-200">
            💡 Solo Plan: Log calls, emails, and meetings with your contacts. Upgrade to Pro for automated activity tracking, email sync, and timeline view.
          </p>
        </div>
      )}

      {plan === "pro" && (
        <div className="mt-8 bg-green-900/30 border border-green-600 rounded-lg p-6">
          <p className="text-green-200">
            🚀 Pro Plan: Full activity tracking with timeline view, email integration, automated logging, and custom activity types.
          </p>
        </div>
      )}
    </div>
  );
}
