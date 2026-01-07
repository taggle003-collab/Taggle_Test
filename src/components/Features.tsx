import { 
  CheckCircle, 
  Search, 
  Zap, 
  Database, 
  Bell, 
  BarChart3 
} from "lucide-react";

const features = [
  {
    name: "Verified Leads",
    description: "Receive laser-targeted leads, fully verified and aligned to your ideal customer profile (ICP), right in your inbox.",
    icon: CheckCircle,
  },
  {
    name: "Prospect Intelligence",
    description: "Gain insight into each lead's buying signals, firmographics, and intent, all enriched automatically.",
    icon: Search,
  },
  {
    name: "Smart Automations",
    description: "Enable intelligent automation to save hours every week and nurture leads without manual intervention.",
    icon: Zap,
  },
  {
    name: "CRM Integrations",
    description: "Seamlessly integrate with Salesforce, HubSpot, and more. Keep your pipeline fresh and organized.",
    icon: Database,
  },
  {
    name: "Real-time Notifications",
    description: "Get instant alerts when high-value prospects show buying intent, so you never miss an opportunity.",
    icon: Bell,
  },
  {
    name: "Advanced Analytics",
    description: "Track performance metrics, conversion rates, and ROI with detailed analytics and reporting.",
    icon: BarChart3,
  },
];

const Features = () => {
  return (
    <div id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-brand-orange font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-brand-black sm:text-4xl">
            Everything you need to scale your outreach
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            In built CRM for you to manage your leads with ease.
          </p>
        </div>

        <div className="mt-20">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="relative p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-brand-orange text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-brand-black">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;
