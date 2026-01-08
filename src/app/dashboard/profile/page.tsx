import React from "react";
import { currentUser } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Profile</h1>
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-orange-600 flex items-center justify-center text-3xl font-bold text-white">
            {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-gray-400">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-black rounded-lg border border-gray-800">
            <span className="text-gray-500 text-sm">Account ID</span>
            <p className="text-gray-300 font-mono text-sm">{user?.id}</p>
          </div>
          <div className="p-4 bg-black rounded-lg border border-gray-800">
            <span className="text-gray-500 text-sm">Member Since</span>
            <p className="text-gray-300">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
