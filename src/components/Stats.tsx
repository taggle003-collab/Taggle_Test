const Stats = () => {
  const stats = [
    { label: "Save weekly", value: "25+ hours" },
    { label: "Cut CAC by up to", value: "60%" },
    { label: "Higher conversions", value: "3x" },
  ];

  return (
    <div className="bg-black py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-extrabold text-orange-600">{stat.value}</div>
              <div className="mt-2 text-lg font-medium text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;
