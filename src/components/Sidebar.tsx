"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck
} from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar = ({ isAdmin }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      name: "Lead Scraper",
      icon: Search,
      href: "/dashboard/leads",
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
    {
      name: "Profile",
      icon: User,
      href: "/dashboard/profile",
    },
  ];

  if (isAdmin) {
    menuItems.push({
      name: "Admin Panel",
      icon: ShieldCheck,
      href: "/admin",
    });
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          className="p-2.5 bg-[#FF6B35] text-white rounded-lg focus:outline-none shadow-lg hover:bg-[#e55a2b] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-[200px] h-screen transition-transform -translate-x-full lg:translate-x-0 bg-[#1a1a1a] border-r border-[#FF6B35]/20 shadow-xl lg:shadow-none",
          isOpen && "translate-x-0"
        )}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          <div className="flex items-center mb-10 px-2 py-4">
            <span className="text-2xl font-bold text-[#FF6B35]">Taggle</span>
          </div>

          <ul className="space-y-2 font-medium flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center p-3 rounded-lg group transition-colors",
                      isActive
                        ? "bg-[#FF6B35] text-white"
                        : "text-gray-400 hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition duration-75",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-[#FF6B35]"
                      )}
                    />
                    <span className="ms-3">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto pt-4 border-t border-[#FF6B35]/20">
            <SignOutButton>
              <button className="flex items-center w-full p-3 text-gray-400 rounded-lg hover:bg-red-900/20 hover:text-red-500 transition-colors min-h-[44px]">
                <LogOut className="w-5 h-5" />
                <span className="ms-3">Logout</span>
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
