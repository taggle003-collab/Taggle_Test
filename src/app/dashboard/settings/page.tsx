import React from "react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Settings</h1>
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
        <p className="text-gray-400">Manage your account settings and preferences.</p>
        <div className="mt-8 space-y-4">
          <div className="p-4 border border-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Notifications</h3>
            <p className="text-gray-500 text-sm">Configure how you receive alerts about new leads.</p>
          </div>
          <div className="p-4 border border-gray-800 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">API Access</h3>
            <p className="text-gray-500 text-sm">Generate API keys to integrate Taggle with your other tools.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
