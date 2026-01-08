const CTA = () => {
  const handleGetEarlyAccess = () => {
    window.location.href = "/sign-up";
  };
  return (
    <div className="bg-orange-600">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-24 lg:px-8 lg:flex lg:items-center lg:justify-between">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          <span className="block">Ready to Transform Your Lead Generation?</span>
          <span className="block text-orange-100 text-xl mt-2">Join hundreds of founders who&apos;ve already discovered the power of qualified leads delivered to their inbox.</span>
        </h2>
        <div className="mt-8 flex flex-col items-center lg:mt-0 lg:flex-shrink-0">
          <div className="inline-flex rounded-md shadow">
            <button
              onClick={handleGetEarlyAccess}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10"
            >
              Get Early Access
            </button>
          </div>
          <p className="mt-4 text-white text-sm font-medium">
            ✨ No spam, no exports, just results
          </p>
        </div>
      </div>
    </div>
  );
};

export default CTA;
