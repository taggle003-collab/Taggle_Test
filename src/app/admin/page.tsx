import { currentUser } from "@clerk/nextjs/server";
import { Users, DollarSign, Search, Clock } from "lucide-react";

export default async function AdminPage() {
  const user = await currentUser();

  const activity = [
    { user: "user1@example.com", action: "Scraped 50 leads", time: "2 hours ago" },
    { user: "user2@example.com", action: "Upgraded to Pro", time: "5 hours ago" },
    { user: "user3@example.com", action: "Sent leads to email", time: "1 day ago" },
  ];

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
      <p className="text-gray-400 mb-8">
        Welcome, {user?.firstName}. Managing the Taggle ecosystem.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-600/20 text-orange-600 rounded-lg">
              <Users size={24} />
            </div>
            <h3 className="text-white font-semibold">Total Users</h3>
          </div>
          <p className="text-white text-3xl font-bold">1,284</p>
          <p className="text-green-500 text-sm mt-2">+12% from last month</p>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-600/20 text-green-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <h3 className="text-white font-semibold">Revenue</h3>
          </div>
          <p className="text-white text-3xl font-bold">$12,450</p>
          <p className="text-green-500 text-sm mt-2">+8% from last month</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-600/20 text-blue-600 rounded-lg">
              <Search size={24} />
            </div>
            <h3 className="text-white font-semibold">Total Scrapes</h3>
          </div>
          <p className="text-white text-3xl font-bold">45,892</p>
          <p className="text-gray-400 text-sm mt-2">Avg 35 per user</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center gap-2">
          <Clock className="text-orange-600" size={20} />
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-700">
          {activity.map((item, i) => (
            <div key={i} className="p-4 hover:bg-gray-700/50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{item.user}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-300">{item.action}</span>
                </div>
                <span className="text-gray-500 text-sm">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
