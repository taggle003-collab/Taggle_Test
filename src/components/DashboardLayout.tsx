import React from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { Home } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
  userPlan?: "lite" | "solo" | "pro" | null;
  userEmail?: string;
}

const DashboardLayout = ({ children, isAdmin, userPlan, userEmail }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      <Sidebar isAdmin={isAdmin} userPlan={userPlan} userEmail={userEmail} />
      <main className="flex-1 lg:ml-[200px]">
        <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-[#FF6B35] transition"
            >
              <Home size={20} />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>
        </div>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
