import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PreBuiltAutomationForm from "@/components/automations/PreBuiltAutomationForm";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export const metadata = {
  title: "Social Media Automation | Taggle",
  description: "Configure social media automation",
};

export default async function SocialAutomationPage() {
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
        <h1 className="text-3xl font-bold text-white">Social Media Automation</h1>
        <p className="text-gray-400">
          Queue outreach messages to social platforms for new leads (integration coming soon).
        </p>
      </div>

      <PreBuiltAutomationForm type="social" userPlan={userPlan} userEmail={userEmail} />
    </div>
  );
}
