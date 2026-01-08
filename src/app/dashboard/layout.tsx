import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayoutComponent from "@/components/DashboardLayout";

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

  return (
    <DashboardLayoutComponent isAdmin={isAdmin}>
      {children}
    </DashboardLayoutComponent>
  );
}
