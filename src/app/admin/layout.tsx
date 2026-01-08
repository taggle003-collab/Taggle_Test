import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardLayoutComponent from "@/components/DashboardLayout";

const ADMIN_EMAIL = "taggle003@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  if (userEmail !== ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayoutComponent isAdmin={true}>
      <div className="mb-8 p-4 bg-orange-600/10 border border-orange-600/20 text-orange-600 rounded-xl">
        <p className="font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
          Admin Area - Restricted Access
        </p>
      </div>
      {children}
    </DashboardLayoutComponent>
  );
}
