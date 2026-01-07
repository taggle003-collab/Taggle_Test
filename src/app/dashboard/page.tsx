import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-white mb-4">
        Welcome, {user?.firstName || "User"}!
      </h1>
      <p className="text-gray-400 mb-8">
        Based on your plan, you'll see your dashboard here soon.
      </p>
      
      {/* Plan Info */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Plan Information</h2>
        <p className="text-gray-400">
          Email: {user?.emailAddresses[0]?.emailAddress}
        </p>
        <p className="text-gray-400 mt-2">
          Plan: Check your database for purchased plan
        </p>
      </div>
    </div>
  );
}
