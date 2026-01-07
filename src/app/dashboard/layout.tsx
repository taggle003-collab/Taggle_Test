import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: { payment?: string };
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Payment Success Banner */}
      {searchParams?.payment === "success" && (
        <div className="bg-green-600 text-white px-4 py-3">
          <p className="max-w-7xl mx-auto font-semibold">
            ✓ Payment successful! Your plan is now active.
          </p>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
