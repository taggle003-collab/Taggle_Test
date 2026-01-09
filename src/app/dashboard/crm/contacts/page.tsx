import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { redirect } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function ContactsPage() {
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
            Contact management is available with Solo and Pro plans. Upgrade to store and organize your leads.
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
          <p className="text-gray-400">
            {plan === "solo"
              ? "Manage your scraped leads and contacts"
              : "Full contact management with advanced features"}
          </p>
        </div>
        <Link
          href="/dashboard/leads"
          className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
        >
          Scrape New Leads
        </Link>
      </div>

      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-bold text-white mb-2">No contacts yet</h2>
          <p className="text-gray-400 mb-6">
            Start by scraping leads from the Lead Scraper page. They will automatically appear here.
          </p>
          <Link
            href="/dashboard/leads"
            className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            Go to Lead Scraper
          </Link>
        </div>
      </div>

      {plan === "solo" && (
        <div className="mt-8 bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-200">
            💡 Tip: With Solo plan, you can store up to 500 contacts per month. Upgrade to Pro for unlimited contacts and advanced features like custom fields and bulk actions.
          </p>
        </div>
      )}
    </div>
  );
}
