import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PreBuiltAutomationForm from "@/components/automations/PreBuiltAutomationForm";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export const metadata = {
  title: "WhatsApp Automation | Taggle",
  description: "Configure WhatsApp automation",
};

export default async function WhatsAppAutomationPage() {
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
        <h1 className="text-3xl font-bold text-white">WhatsApp Automation</h1>
        <p className="text-gray-400">
          Set up a WhatsApp message workflow for new leads (integration coming soon).
        </p>
      </div>

      <PreBuiltAutomationForm type="whatsapp" userPlan={userPlan} userEmail={userEmail} />
    </div>
  );
}
