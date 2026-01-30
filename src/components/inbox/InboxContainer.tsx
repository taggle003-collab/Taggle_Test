'use client';

import { useEffect, useState } from 'react';
import { getFeatureLevel } from '@/lib/feature-access';
import type { InboxStats, LeadBatch } from '@/lib/inbox-types';
import { getAllLeadBatches, getAllInboxStats } from '@/lib/inbox-utils';

// Components
import { LiteInboxView } from './LiteInboxView';
import { SoloInboxView } from './SoloInboxView';
import { ProInboxView } from './ProInboxView';
import { StorageIndicator } from './StorageIndicator';

interface InboxContainerProps {
  userPlan: string;
  userEmail?: string;
  batchId?: string;
}

export function InboxContainer({ userPlan, userEmail, batchId }: InboxContainerProps) {
  const [batches, setBatches] = useState<LeadBatch[]>([]);
  const [stats, setStats] = useState<InboxStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(batchId || null);

  const planLevel = getFeatureLevel(userPlan as 'lite' | 'solo' | 'pro' | null | undefined, userEmail, 'leadScraping');
  
  // Map userPlan to inbox view level
  const inboxViewLevel = !userPlan ? 'none' : userPlan === 'lite' ? 'basic' : userPlan === 'solo' ? 'limited' : 'full';

  useEffect(() => {
    loadInboxData();
  }, [userPlan, userEmail]);

  const loadInboxData = () => {
    try {
      setIsLoading(true);
      const allBatches = getAllLeadBatches();
      const inboxStats = getAllInboxStats();
      
      setBatches(allBatches);
      setStats(inboxStats);
      
      // Auto-select first batch if none selected
      if (!selectedBatchId && allBatches.length > 0) {
        setSelectedBatchId(allBatches[0].id);
      }
    } catch (error) {
      console.error('Error loading inbox data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    // Delete logic would go here
    loadInboxData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-400">Loading inbox data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats & Storage Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-white">{stats?.totalBatches || 0}</div>
              <div className="text-sm text-gray-400">Total Batches</div>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-white">{stats?.totalLeads || 0}</div>
              <div className="text-sm text-gray-400">Total Leads</div>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-white">{stats?.averageQualityScore || 0}%</div>
              <div className="text-sm text-gray-400">Avg Quality</div>
            </div>
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-white">{!userPlan ? 'None' : userPlan === 'lite' ? 'Lite' : userPlan === 'solo' ? 'Solo' : 'Pro'}</div>
              <div className="text-sm text-gray-400">Plan Level</div>
            </div>
          </div>
        </div>

        {/* Storage Indicator */}
        <StorageIndicator 
          used={stats?.storageUsed || 0}
          limit={stats?.storageLimit || 100}
          planLevel={inboxViewLevel}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Batch List Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Lead Batches</h3>
            
            {batches.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">No batches yet</div>
                <button
                  onClick={() => window.location.href = '/dashboard/lead-scraper'}
                  className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Scrape Your First Leads
                </button>

            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedBatchId === batch.id
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                        : 'border-gray-600 hover:border-gray-500 bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="font-medium text-white text-sm mb-1">{batch.name}</div>
                    <div className="text-xs text-gray-400">
                      {batch.totalLeads} leads • {new Date(batch.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Avg: {batch.stats.averageQualityScore}%
                      </div>
                      <div className="flex gap-1">
                        {batch.deliveryMethods.email && (
                          <span className="text-xs bg-blue-600 text-white px-1 rounded">Email</span>
                        )}
                        {batch.deliveryMethods.export && (
                          <span className="text-xs bg-green-600 text-white px-1 rounded">Export</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Inbox View */}
        <div className="lg:col-span-3">
          {batches.length === 0 ? (
            <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-8 text-center">
              <div className="text-gray-400 mb-4">Welcome to your Lead Inbox!</div>
              <p className="text-gray-500 text-sm mb-6">
                Your scraped leads will appear here. Start by creating your first lead scraping campaign.
              </p>
              <button 
                onClick={() => window.location.href = '/dashboard/lead-scraper'}
                className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-3 rounded-lg transition-colors"
              >
                Go to Lead Scraper
              </button>
            </div>
          ) : selectedBatchId ? (
            <div className="bg-[#2a2a2a] rounded-lg border border-gray-700">
              {/* Render appropriate view based on plan level */}
              {inboxViewLevel === 'none' && (
                <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-8 text-center">
                  <div className="text-gray-400 mb-4">No access to inbox features</div>
                  <p className="text-gray-500 text-sm mb-6">
                    Upgrade your plan to access lead inbox functionality.
                  </p>
                  <button 
                    onClick={() => window.location.href = '/dashboard/billing'}
                    className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Upgrade Plan
                  </button>
                </div>
              )}
              
              {inboxViewLevel === 'basic' && (
                <LiteInboxView 
                  batch={batches.find(b => b.id === selectedBatchId)!}
                  onDeleteBatch={handleDeleteBatch}
                  userEmail={userEmail}
                />
              )}
              
              {inboxViewLevel === 'limited' && (
                <SoloInboxView 
                  batch={batches.find(b => b.id === selectedBatchId)!}
                  onDeleteBatch={handleDeleteBatch}
                  userEmail={userEmail}
                  onRefresh={loadInboxData}
                />
              )}
              
              {inboxViewLevel === 'full' && (
                <ProInboxView 
                  batch={batches.find(b => b.id === selectedBatchId)!}
                  onDeleteBatch={handleDeleteBatch}
                  userEmail={userEmail}
                  onRefresh={loadInboxData}
                />
              )}
            </div>
          ) : (
            <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-8 text-center">
              <div className="text-gray-400">Select a batch to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}