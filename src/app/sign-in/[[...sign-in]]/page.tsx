import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const isClerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {isClerkConfigured ? (
          <SignIn />
        ) : (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 text-white">
            <h1 className="text-xl font-semibold">Authentication not configured</h1>
            <p className="mt-2 text-sm text-gray-300">
              Please set <code className="text-white">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to enable sign in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
