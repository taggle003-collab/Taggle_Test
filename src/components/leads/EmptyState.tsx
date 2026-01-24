'use client';

import React from 'react';
import { Upload, Database, ExternalLink } from 'lucide-react';

interface EmptyStateProps {
  onImportClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onImportClick }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-8 text-center">
      <div className="max-w-md mx-auto">
        <Database size={64} className="mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No leads yet</h3>
        <p className="text-gray-400 mb-6">
          Get started by importing your leads from a CSV file into your Supabase database.
        </p>
        
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 text-left">
            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
              <Upload size={16} className="text-[#FF6B35]" />
              How to import your leads:
            </h4>
            <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to the "leads" table</li>
              <li>Click "Insert" → "Import data via CSV"</li>
              <li>Upload your CSV file with lead information</li>
              <li>Return here to see your leads</li>
            </ol>
          </div>
          
          <div className="flex gap-3 justify-center">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
            >
              <ExternalLink size={16} />
              Open Supabase Dashboard
            </a>
          </div>
          
          <p className="text-xs text-gray-500">
            Need help with CSV format? Make sure your file includes columns like: name, email, phone, country, city, businessType
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;