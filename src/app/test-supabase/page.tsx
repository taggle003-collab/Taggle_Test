'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase
          .from('leads')
          .select('count')
          .limit(1);

        if (error) {
          setError(`Connection Error: ${error.message}`);
          setStatus('Failed');
        } else {
          setStatus('Connected Successfully');
        }
      } catch (err) {
        setError(`Connection Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setStatus('Failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              status === 'Connected Successfully' ? 'bg-green-500' :
              status === 'Failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="font-semibold">Status: {status}</span>
          </div>
          
          {error && (
            <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 text-red-400">
              <p>{error}</p>
            </div>
          )}
          
          {status === 'Connected Successfully' && (
            <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-4 text-green-400">
              <p>✅ Supabase is properly configured and connected!</p>
              <p className="text-sm mt-2">You can now import leads via the Supabase dashboard and view them in the "My Leads" section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}