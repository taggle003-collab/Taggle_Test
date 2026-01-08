export default function SoloDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#FF6B35]/20 to-gray-800 rounded-lg p-6 border border-[#FF6B35]">
        <h2 className="text-2xl font-bold text-white mb-4">Solo Plan Dashboard</h2>
        <p className="text-gray-400 mb-4">
          You have access to 500 verified leads per month with insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Leads This Month</p>
            <p className="text-3xl font-bold text-[#FF6B35]">0/500</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Plan Type</p>
            <p className="text-xl font-bold text-white">Solo (Monthly)</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">CRM Integrations</p>
            <p className="text-xl font-bold text-green-400">✓ Limited</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Lead Insights</h3>
          <p className="text-gray-400">Lead insights and analysis coming soon.</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">CRM Integrations</h3>
          <p className="text-gray-400">Connect with Salesforce or HubSpot.</p>
        </div>
      </div>

      <div className="bg-green-900/30 border border-green-600 rounded-lg p-6">
        <p className="text-green-200">
          ⭐ Recommended plan. Upgrade to Pro for full CRM and automation features.
        </p>
      </div>
    </div>
  );
}