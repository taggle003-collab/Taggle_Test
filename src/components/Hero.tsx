"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const Hero = () => {
  const router = useRouter();

  const handleStartFree = () => {
    router.push("/sign-up");
  };

  return (
    <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl tracking-tight font-extrabold text-black sm:text-5xl md:text-6xl">
            <span className="block">Only Talk to those who are</span>
            <span className="block text-orange-600">ready to talk to you.</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Verified leads sent straight to your inbox. Download in a click. Automate the rest.
          </p>
          <div className="mt-10 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <button
                onClick={handleStartFree}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg md:px-10 transition-colors"
              >
                Enjoy a 7-day free trial
              </button>
            </div>
          </div>
          <div className="mt-12 space-y-2">
            <p className="text-lg font-semibold text-black">
              Taggle Delivers the Leads That Convert
            </p>
            <p className="max-w-2xl mx-auto text-gray-500">
              Verified contacts. Real-time insights. Smart automations. CRM integrations ready.
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>
    </div>
  );
};

export default Hero;
