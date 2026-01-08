import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

const DashboardLayout = ({ children, isAdmin }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      <Sidebar isAdmin={isAdmin} />
      <main className="flex-1 lg:ml-[200px]">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
