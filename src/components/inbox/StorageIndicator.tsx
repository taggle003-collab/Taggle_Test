'use client';

interface StorageIndicatorProps {
  used: number;
  limit: number;
  planLevel: 'basic' | 'limited' | 'full';
}

export function StorageIndicator({ used, limit, planLevel }: StorageIndicatorProps) {
  const percentage = Math.round((used / limit) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;
  
  const planName = planLevel === 'full' ? 'Pro' : planLevel === 'limited' ? 'Solo' : 'Lite';
  
  return (
    <div className="bg-[#2a2a2a] rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">Storage Usage</h3>
        <span className={`text-xs px-2 py-1 rounded ${
          planLevel === 'full' 
            ? 'bg-purple-600 text-white' 
            : planLevel === 'limited'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-600 text-white'
        }`}>
          {planName}
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Used</span>
          <span className={`font-medium ${
            isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white'
          }`}>
            {used.toLocaleString()} / {limit.toLocaleString()}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              isCritical 
                ? 'bg-red-500' 
                : isWarning 
                ? 'bg-yellow-500' 
                : 'bg-[#FF6B35]'
            }`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-500">
          {isCritical ? (
            <span className="text-red-400">⚠️ Storage almost full - delete old batches</span>
          ) : isWarning ? (
            <span className="text-yellow-400">⚡ {100 - percentage}% remaining</span>
          ) : (
            <span>{percentage}% used • {limit - used} leads remaining</span>
          )}
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="text-xs text-gray-500 space-y-1">
          <div>• Batches expire in {planLevel === 'full' ? 90 : planLevel === 'limited' ? 60 : 30} days</div>
          <div>• Upgrade for more storage</div>
        </div>
      </div>
    </div>
  );
}