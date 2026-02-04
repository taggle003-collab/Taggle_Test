import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { InboxContainer } from "@/components/inbox/InboxContainer";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { batch?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const isAdmin = userEmail === ADMIN_EMAIL;
  const userPlanData = await getUserPlan(userId);
  const userPlan = isAdmin ? "pro" : (userPlanData?.plan || "lite");

  const batchId = searchParams.batch;

  return (
    <DashboardLayout userPlan={userPlan} userEmail={userEmail}>
      <div className="p-6 bg-[#1a1a1a] min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lead Inbox</h1>
          <p className="text-gray-400">
            View and manage your scraped leads with intelligent insights
          </p>
        </div>

        {/* Main Inbox Container */}
        <InboxContainer 
          userPlan={userPlan}
          userEmail={userEmail}
          batchId={batchId}
        />
      </div>
    </DashboardLayout>
  );
}