import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function CRMPage() {
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
            The built-in CRM is available with Solo and Pro plans. Upgrade to manage your leads, track deals, and automate your sales pipeline.
          </p>
          <div className="space-y-3">
            <Link
              href="/#pricing"
              className="inline-block bg-[#FF6B35] text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Solo and Pro users see CRM dashboard
  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {plan === "solo" ? "Limited CRM" : "Full CRM"}
        </h1>
        <p className="text-gray-400">
          {plan === "solo"
            ? "Manage your contacts and track basic activities"
            : "Complete CRM with contacts, pipeline, tasks, and automation"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/dashboard/crm/contacts"
          className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-[#FF6B35] transition"
        >
          <div className="text-3xl font-bold text-[#FF6B35] mb-2">0</div>
          <div className="text-white font-semibold mb-1">Contacts</div>
          <div className="text-gray-400 text-sm">All your leads</div>
        </Link>

        <Link
          href="/dashboard/crm/pipeline"
          className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-[#FF6B35] transition"
        >
          <div className="text-3xl font-bold text-[#FF6B35] mb-2">0</div>
          <div className="text-white font-semibold mb-1">Pipeline</div>
          <div className="text-gray-400 text-sm">Active deals</div>
        </Link>

        <Link
          href="/dashboard/crm/activities"
          className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-[#FF6B35] transition"
        >
          <div className="text-3xl font-bold text-[#FF6B35] mb-2">0</div>
          <div className="text-white font-semibold mb-1">Activities</div>
          <div className="text-gray-400 text-sm">Calls, emails, meetings</div>
        </Link>

        <Link
          href="/dashboard/crm/tasks"
          className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 hover:border-[#FF6B35] transition"
        >
          <div className="text-3xl font-bold text-[#FF6B35] mb-2">0</div>
          <div className="text-white font-semibold mb-1">Tasks</div>
          <div className="text-gray-400 text-sm">Follow-ups</div>
        </Link>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/leads"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
          >
            <div className="text-white font-semibold mb-1">Scrape New Leads</div>
            <div className="text-gray-400 text-sm">Find new prospects</div>
          </Link>
          <Link
            href="/dashboard/crm/contacts"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
          >
            <div className="text-white font-semibold mb-1">Add Contact</div>
            <div className="text-gray-400 text-sm">Manual entry</div>
          </Link>
          <Link
            href="/dashboard/crm/tasks"
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
          >
            <div className="text-white font-semibold mb-1">Create Task</div>
            <div className="text-gray-400 text-sm">Set reminders</div>
          </Link>
        </div>
      </div>

      {plan === "solo" && (
        <div className="mt-8 bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-200">
            📊 Limited CRM: You have access to basic contact management and activity tracking.
            Upgrade to Pro for full pipeline management, tasks, automation, and advanced analytics.
          </p>
        </div>
      )}

      {plan === "pro" && (
        <div className="mt-8 bg-green-900/30 border border-green-600 rounded-lg p-6">
          <p className="text-green-200">
            🚀 Full CRM: You have access to all CRM features including contacts, pipeline, activities, tasks, and automation.
          </p>
        </div>
      )}
    </div>
  );
}
