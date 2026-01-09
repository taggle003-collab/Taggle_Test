import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

interface UpgradePromptProps {
  requiredPlan: string;
  featureName?: string;
  description?: string;
}

const UpgradePrompt = ({ requiredPlan, featureName, description }: UpgradePromptProps) => {
  return (
    <div className="p-8 bg-black rounded-lg border border-[#FF6B35] text-center">
      <Lock className="mx-auto mb-4 text-[#FF6B35]" size={48} />
      <h3 className="text-white text-xl font-bold mb-2">
        Unlock this feature
      </h3>
      <p className="text-gray-400 mb-2">
        {description || `This feature is available in the ${requiredPlan} plan and above`}
      </p>
      {featureName && (
        <p className="text-gray-500 text-sm mb-4">
          Feature: {featureName}
        </p>
      )}
      <Link
        href="/#pricing"
        className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e55a2b] transition-colors"
      >
        Upgrade to {requiredPlan}
        <ArrowRight size={18} />
      </Link>
    </div>
  );
};

export default UpgradePrompt;
