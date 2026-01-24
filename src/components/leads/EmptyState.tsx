"use client";

import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">📋</div>
      <h2 className="text-2xl font-bold text-white mb-3">No leads yet</h2>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        Import a CSV file into your Supabase <code className="bg-gray-800 px-2 py-1 rounded">leads</code> table to get started.
      </p>

      <div className="space-y-3">
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#FF6B35] hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          Open Supabase Dashboard
        </a>

        <div>
          <Link
            href="/dashboard/leads/scraper"
            className="text-[#FF6B35] hover:underline text-sm"
          >
            Or scrape new leads with Taggle
          </Link>
        </div>
      </div>

      <div className="mt-8 text-left max-w-lg mx-auto bg-[#2a2a2a] border border-gray-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Quick CSV import steps</h3>
        <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
          <li>Go to your Supabase project</li>
          <li>Open <span className="text-gray-300">Table Editor</span> → <span className="text-gray-300">leads</span></li>
          <li>Click <span className="text-gray-300">Insert</span> → <span className="text-gray-300">Import data from CSV</span></li>
          <li>Refresh this page</li>
        </ol>
      </div>
    </div>
  );
}
