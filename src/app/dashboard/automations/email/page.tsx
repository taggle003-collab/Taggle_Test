import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PreBuiltAutomationForm from "@/components/automations/PreBuiltAutomationForm";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export const metadata = {
  title: "Email Automation | Taggle",
  description: "Configure email automation",
};

export default async function EmailAutomationPage() {
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
        <h1 className="text-3xl font-bold text-white">Email Automation</h1>
        <p className="text-gray-400">Create an email workflow that triggers on new leads.</p>
      </div>

      <PreBuiltAutomationForm type="email" userPlan={userPlan} userEmail={userEmail} />
    </div>
  );
}
