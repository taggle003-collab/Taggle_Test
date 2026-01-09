import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { hasFeature, getFeatureLevel } from "@/lib/feature-access";
import { redirect } from "next/navigation";
import Link from "next/link";
import UpgradePrompt from "@/components/UpgradePrompt";

export default async function ActivitiesPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const userPlanData = await getUserPlan(user.id);
  const plan = userPlanData?.plan as "lite" | "solo" | "pro" | undefined;
  const hasCRM = hasFeature(plan, userEmail, "crmAccess");
  const automationLevel = getFeatureLevel(plan, userEmail, "automations");

  if (!hasCRM) {
    return (
      <div className="py-8">
        <UpgradePrompt
          requiredPlan="Solo"
          featureName="Activity Tracking"
          description="Activity tracking is available with Solo and Pro plans. Upgrade to log calls, emails, and meetings."
        />
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

      {automationLevel === "limited" && (
        <div className="mt-8 bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-200">
            💡 Solo Plan: Log calls, emails, and meetings with your contacts. Upgrade to Pro for automated activity tracking, email sync, and timeline view.
          </p>
        </div>
      )}

      {automationLevel === "full" && (
        <div className="mt-8 bg-green-900/30 border border-green-600 rounded-lg p-6">
          <p className="text-green-200">
            🚀 Pro Plan: Full activity tracking with timeline view, email integration, automated logging, and custom activity types.
          </p>
        </div>
      )}
    </div>
  );
}
