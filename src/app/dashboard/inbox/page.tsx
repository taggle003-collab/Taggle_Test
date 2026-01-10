'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

// Components
import DashboardLayout from '../../../components/DashboardLayout';
import { InboxContainer } from '../../../components/inbox/InboxContainer';

// Utils
import { saveUserToLocalStorage, getUserPlanFromStorage, getUserEmailFromStorage } from '../../../lib/user-plan';

export default function InboxPage() {
  const { user, isLoaded } = useUser();
  const [userPlan, setUserPlan] = useState<'lite' | 'solo' | 'pro' | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Try to get user data from localStorage first (for faster loading)
    const storedPlan = getUserPlanFromStorage();
    const storedEmail = getUserEmailFromStorage();

    if (storedPlan) setUserPlan(storedPlan);
    if (storedEmail) setUserEmail(storedEmail);

    // Then get actual user data from Clerk
    if (isLoaded && user) {
      // Get plan from user metadata
      const plan = user.unsafeMetadata?.plan as 'lite' | 'solo' | 'pro' | undefined;
      const email = user.emailAddresses?.[0]?.emailAddress || null;

      if (plan) setUserPlan(plan);
      if (email) setUserEmail(email);

      // Save to localStorage for future client-side access
      saveUserToLocalStorage(plan || null, email);
    }
  }, [user, isLoaded]);

  if (!isLoaded) {
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
    <DashboardLayout userPlan={userPlan || 'lite'} userEmail={userEmail || ''}>
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
          userPlan={userPlan || 'lite'}
          userEmail={userEmail || ''}
          batchId={batchId || undefined}
        />
      </div>
    </DashboardLayout>
  );
}