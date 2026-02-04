"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-orange-600">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-orange-600">
          T<span className="text-white">aggle</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="text-white hover:text-orange-600 transition">
            Home
          </a>
          <a href="/#features" className="text-white hover:text-orange-600 transition">
            Features
          </a>
          <a href="/#pricing" className="text-white hover:text-orange-600 transition">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-white hover:text-orange-600 transition">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <a href="/dashboard" className="text-white hover:text-orange-600 transition">
              Dashboard
            </a>
            <UserButton />
          </SignedIn>

          <div className="md:hidden">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="sr-only">Open menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden py-4 px-4 border-t border-gray-800">
          <div className="flex flex-col space-y-4">
            <a href="/" className="text-white hover:text-orange-600 transition">
              Home
            </a>
            <a href="/#features" className="text-white hover:text-orange-600 transition">
              Features
            </a>
            <a href="/#pricing" className="text-white hover:text-orange-600 transition">
              Pricing
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
