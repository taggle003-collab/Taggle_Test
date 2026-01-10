// No "use client" - This is a Server Component
import { currentUser } from '@clerk/nextjs/server';

// Components
import DashboardLayout from '../../../components/DashboardLayout';
import { InboxContainer } from '../../../components/inbox/InboxContainer';

// Utils
import { getAllLeadBatches, getAllInboxStats } from '../../../lib/inbox-utils';
import { getFeatureLevel } from '../../../lib/feature-access';

export default async function InboxPage() {
  // Server-side data fetching
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const plan = (user?.unsafeMetadata?.plan as 'lite' | 'solo' | 'pro' | undefined) || 'lite';

  // Fetch inbox data server-side
  const batches = getAllLeadBatches();
  const stats = getAllInboxStats(plan, email);
  const featureLevel = getFeatureLevel(plan, email, 'inboxDelivery');

  // Handle missing user
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
  // Note: useSearchParams needs to be used in a client component, so we'll handle this differently
  // For now, we'll pass undefined and let the client component handle URL params if needed

  return (
    <DashboardLayout userPlan={plan} userEmail={email}>
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
          userPlan={plan}
          userEmail={email}
          batches={batches}
          stats={stats}
          featureLevel={featureLevel}
        />
      </div>
    </DashboardLayout>
  );
}