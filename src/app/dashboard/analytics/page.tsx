import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = userEmail === ADMIN_EMAIL;
  const userPlanData = await getUserPlan(userId);
  const userPlan = isAdmin ? "pro" : (userPlanData?.plan || "lite");

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">
            Track your lead generation performance and campaign insights
          </p>
        </div>
        <AnalyticsDashboard userPlan={userPlan} userEmail={userEmail} />
      </div>
    </div>
  );
}