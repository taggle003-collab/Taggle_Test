import LeadScraping from "@/components/LeadScraping";

export default function ProDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600/30 to-gray-800 rounded-lg p-6 border-2 border-orange-600">
        <h2 className="text-2xl font-bold text-white mb-4">Pro Plan Dashboard</h2>
        <p className="text-gray-400 mb-4">
          You have access to 1500 verified leads per month with full features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Leads This Month</p>
            <p className="text-3xl font-bold text-orange-600">0/1500</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Plan Type</p>
            <p className="text-xl font-bold text-white">Pro (Monthly)</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Automations</p>
            <p className="text-xl font-bold text-green-400">✓ All Enabled</p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Analytics</p>
            <p className="text-xl font-bold text-green-400">✓ Full Access</p>
          </div>
        </div>
      </div>

      <LeadScraping />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Lead Intelligence</h3>
          <p className="text-gray-400 mb-4">Advanced insights and buying signals.</p>
          <ul className="space-y-2">
            <li className="text-green-400">✓ Firmographics</li>
            <li className="text-green-400">✓ Intent Signals</li>
            <li className="text-green-400">✓ Buying Behavior</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Full Automation</h3>
          <p className="text-gray-400 mb-4">Smart automation engine for lead nurturing.</p>
          <ul className="space-y-2">
            <li className="text-green-400">✓ Email Sequences</li>
            <li className="text-green-400">✓ Lead Scoring</li>
            <li className="text-green-400">✓ Auto-qualification</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">CRM Integrations</h3>
          <p className="text-gray-400 mb-4">Full integration with major CRM platforms.</p>
          <ul className="space-y-2">
            <li className="text-green-400">✓ Salesforce</li>
            <li className="text-green-400">✓ HubSpot</li>
            <li className="text-green-400">✓ Pipedrive</li>
          </ul>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Advanced Analytics</h3>
          <p className="text-gray-400 mb-4">Comprehensive performance metrics and ROI tracking.</p>
          <ul className="space-y-2">
            <li className="text-green-400">✓ Conversion Tracking</li>
            <li className="text-green-400">✓ ROI Dashboard</li>
            <li className="text-green-400">✓ Custom Reports</li>
          </ul>
        </div>
      </div>

      <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-6">
        <p className="text-orange-200">
          🚀 Premium plan unlocked! You have full access to all Taggle features.
        </p>
      </div>
    </div>
  );
}