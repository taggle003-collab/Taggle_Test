import { currentUser } from "@clerk/nextjs/server";
import { getUserPlan } from "@/lib/user-plan";
import { hasFeature, getFeatureLevel } from "@/lib/feature-access";
import { redirect } from "next/navigation";
import Link from "next/link";
import UpgradePrompt from "@/components/UpgradePrompt";

export default async function ContactsPage() {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const userPlanData = await getUserPlan(user.id);
  const plan = userPlanData?.plan as "lite" | "solo" | "pro" | undefined;
  const hasCRM = hasFeature(plan, userEmail, "crmAccess");
  const crmLevel = getFeatureLevel(plan, userEmail, "crmIntegrations");

  if (!hasCRM) {
    return (
      <div className="py-8">
        <UpgradePrompt
          requiredPlan="Solo"
          featureName="Contact Management"
          description="Contact management is available with Solo and Pro plans. Upgrade to store and organize your leads."
        />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
          <p className="text-gray-400">
            {crmLevel === "limited"
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
            Start by scraping leads from Lead Scraper page. They will automatically appear here.
          </p>
          <Link
            href="/dashboard/leads"
            className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
          >
            Go to Lead Scraper
          </Link>
        </div>
      </div>

      {crmLevel === "limited" && (
        <div className="mt-8 bg-blue-900/30 border border-blue-600 rounded-lg p-6">
          <p className="text-blue-200">
            💡 Solo Plan: You can store and manage up to 500 contacts per month. Upgrade to Pro for unlimited contacts, custom fields, bulk actions, and advanced filters.
          </p>
        </div>
      )}

      {crmLevel === "full" && (
        <div className="mt-8 bg-green-900/30 border border-green-600 rounded-lg p-6">
          <p className="text-green-200">
            🚀 Pro Plan: Full contact management with unlimited storage, custom fields, bulk import/export, advanced filters, and contact enrichment.
          </p>
        </div>
      )}
    </div>
  );
}
