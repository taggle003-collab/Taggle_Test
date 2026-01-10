'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { currentUser } from '@clerk/nextjs';

// Components
import DashboardLayout from '../../../components/DashboardLayout';
import { InboxContainer } from '../../../components/inbox/InboxContainer';

// Utils
import { getUserPlanClient } from '../../../lib/user-plan';

export default function InboxPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function loadUserData() {
      try {
        const current = await currentUser();
        const userEmail = current?.emailAddresses[0]?.emailAddress;
        const userData = {
          plan: getUserPlanClient(),
          email: userEmail,
        };
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
        setUser({
          plan: getUserPlanClient(),
          email: undefined,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout userPlan="lite" userEmail="">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading inbox...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout userPlan="lite" userEmail="">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Please sign in to access your inbox</div>
        </div>
      </DashboardLayout>
    );
  }

  // Parse query params - useful for direct batch links
  const batchId = searchParams.get('batch');

  return (
    <DashboardLayout userPlan={user.plan} userEmail={user.email}>
      <div className="p-6 bg-[#1a1a1a] min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Lead Inbox</h1>
          <p className="text-gray-400">
            View and manage your scraped leads with intelligent insights
          </p>
        </div>

        {/* Main Inbox Container */}
        <InboxContainer 
          userPlan={user.plan}
          userEmail={user.email}
          batchId={batchId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}