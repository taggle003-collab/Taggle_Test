import LeadScraping from "@/components/LeadScraping";

export default function LiteDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Lite Plan Dashboard</h2>
        <p className="text-gray-400 mb-4">
          You have access to 100 verified leads per month.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Leads This Month</p>
            <p className="text-3xl font-bold text-orange-600">0/100</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Plan Type</p>
            <p className="text-xl font-bold text-white">Lite (Monthly)</p>
          </div>
        </div>
      </div>

      <LeadScraping />

      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-6">
        <p className="text-blue-200">
          📧 Inbox delivery only. Upgrade to Solo for insights and CRM integrations.
        </p>
      </div>
    </div>
  );
}