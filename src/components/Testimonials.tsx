const testimonials = [
  {
    content: "Taggle has transformed our B2B outreach. We've seen a 43% increase in qualified leads and our sales team is closing deals 30% faster.",
    author: "Sarah Johnson",
    role: "VP of Sales, TechGrowth Inc.",
  },
  {
    content: "Thanks to Taggle, we're focusing only on leads that are 5x more likely to convert. It's saved our team hours every week.",
    author: "Michael Chen",
    role: "Marketing Director, Innovate Solutions",
  },
  {
    content: "Since switching to Taggle, our cost per acquisition dropped by 35% and our conversion rate doubled. It's a no-brainer.",
    author: "Emma Rodriguez",
    role: "Growth Lead, Scale Ventures",
  },
  {
    content: "The quality of leads from Taggle is unmatched. We're closing deals faster and spending less time on qualification.",
    author: "David Park",
    role: "CEO, StartupFlow",
  },
  {
    content: "Taggle's automation features have streamlined our entire lead process. Our team can focus on what they do best - closing deals.",
    author: "Lisa Thompson",
    role: "Sales Director, GrowthLabs",
  },
  {
    content: "We've tried many lead generation tools, but Taggle delivers the highest quality prospects we've ever seen.",
    author: "James Wilson",
    role: "CMO, TechForward",
  },
];

const Testimonials = () => {
  return (
    <div id="testimonials" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-black sm:text-4xl">
            Trusted by Industry Leaders - See how companies are scaling their outreach with Taggle.
          </h2>
        </div>
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="flex flex-col bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100 hover:border-orange-600 transition-colors"
              >
                <blockquote className="flex-1">
                  <p className="text-lg text-gray-700 italic">"{testimonial.content}"</p>
                </blockquote>
                <div className="mt-8">
                  <p className="text-base font-bold text-black">{testimonial.author}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
