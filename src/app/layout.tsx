import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taggle - Verified Leads to Your Inbox",
  description: "Verified leads delivered straight to your inbox. Download in a click. Automate the rest.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(publishableKey);

  const app = (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
              {isClerkConfigured ? (
                <>
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
                </>
              ) : (
                <>
                  <a href="/sign-in" className="text-white hover:text-orange-600 transition">
                    Sign In
                  </a>
                  <a
                    href="/sign-up"
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
                  >
                    Sign Up
                  </a>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );

  if (!isClerkConfigured) {
    return app;
  }

  return <ClerkProvider publishableKey={publishableKey!}>{app}</ClerkProvider>;
}
