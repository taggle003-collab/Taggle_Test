'use client';

interface RecommendationsCardProps {
  recommendations: string[];
  advanced?: boolean;
}

export function RecommendationsCard({ recommendations, advanced = false }: RecommendationsCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        {advanced ? 'Advanced Recommendations' : 'Data-Driven Insights'}
      </h3>
      
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 rounded border border-gray-600">
            <div className="text-[#FF6B35] font-bold">•</div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">{recommendation}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>💡</span>
          <span>{advanced ? 'AI-powered insights' : 'Based on your lead data patterns'}</span>
        </div>
      </div>
    </div>
  );
}