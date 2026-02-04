import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AutomationsHub from "@/components/automations/AutomationsHub";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export const metadata = {
  title: "Automations | Taggle",
  description: "Create and manage outreach automations",
};

export default async function AutomationsPage() {
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
        <h1 className="text-3xl font-bold text-white">Automations</h1>
        <p className="text-gray-400">
          Set up pre-built workflows for email, WhatsApp, and social outreach — or build custom
          automations on Pro.
        </p>
      </div>

      <AutomationsHub userPlan={userPlan} userEmail={userEmail} />
    </div>
  );
}
