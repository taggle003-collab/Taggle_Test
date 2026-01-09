import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayoutComponent from "@/components/DashboardLayout";
import PostSignupHandler from "@/components/PostSignupHandler";
import { getUserPlan } from "@/lib/user-plan";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const isAdmin = user?.emailAddresses[0]?.emailAddress === ADMIN_EMAIL;
  const userPlanData = await getUserPlan(userId);
  const userPlan = isAdmin ? "pro" : (userPlanData?.plan || "lite");

  return (
    <DashboardLayoutComponent isAdmin={isAdmin} userPlan={userPlan}>
      <PostSignupHandler />
      {children}
    </DashboardLayoutComponent>
  );
}
