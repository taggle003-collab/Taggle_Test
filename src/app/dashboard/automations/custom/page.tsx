import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import CustomAutomationBuilder from "@/components/automations/CustomAutomationBuilder";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export const metadata = {
  title: "Custom Automations | Taggle",
  description: "Build custom automations",
};

export default async function CustomAutomationsPage() {
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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Custom Automations</h1>
        <p className="text-gray-400">
          Build multi-step workflows with advanced triggers, conditions, and actions.
        </p>
      </div>

      <CustomAutomationBuilder userPlan={userPlan} userEmail={userEmail} />
    </div>
  );
}
