import { currentUser } from "@clerk/nextjs/server";

export default async function AdminPage() {
  const user = await currentUser();

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
      <p className="text-gray-400 mb-8">
        Welcome, {user?.firstName}. Admin features coming soon.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Users</h3>
          <p className="text-orange-600 text-2xl font-bold">--</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Revenue</h3>
          <p className="text-orange-600 text-2xl font-bold">--</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-white font-semibold mb-2">Leads</h3>
          <p className="text-orange-600 text-2xl font-bold">--</p>
        </div>
      </div>
    </div>
  );
}
