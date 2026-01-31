interface RateLimitResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
}

interface UserLimits {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private searchLimits: Map<string, UserLimits> = new Map();
  private emailLimits: Map<string, UserLimits> = new Map();

  private getCurrentMinute(): number {
    return Math.floor(Date.now() / 60000);
  }

  private getCurrentDay(): number {
    return Math.floor(Date.now() / 86400000);
  }

  private getMinuteKey(userId: string, timeUnit: number): string {
    return `${userId}-${timeUnit}`;
  }

  private checkLimit(
    limitsMap: Map<string, UserLimits>,
    userId: string,
    limitPerMinute: number,
    limitPerDay: number,
    type: 'search' | 'email'
  ): RateLimitResult {
    const now = Date.now();
    const currentMinute = this.getCurrentMinute();
    const currentDay = this.getCurrentDay();

    const minuteKey = this.getMinuteKey(userId, currentMinute);
    const dayKey = this.getMinuteKey(userId, currentDay);

    // Check per-minute limit
    let minuteData = limitsMap.get(minuteKey);
    if (!minuteData || minuteData.resetTime < now) {
      minuteData = { count: 0, resetTime: (currentMinute + 1) * 60000 };
      limitsMap.set(minuteKey, minuteData);
    }

    if (minuteData.count >= limitPerMinute) {
      const retryAfter = Math.ceil((minuteData.resetTime - now) / 1000);
      return {
        success: false,
        error: `Too many ${type} requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      };
    }

    // Check per-day limit
    let dayData = limitsMap.get(dayKey);
    if (!dayData || dayData.resetTime < now) {
      dayData = { count: 0, resetTime: (currentDay + 1) * 86400000 };
      limitsMap.set(dayKey, dayData);
    }

    if (dayData.count >= limitPerDay) {
      const retryAfter = Math.ceil((dayData.resetTime - now) / 1000);
      return {
        success: false,
        error: `Daily ${type} limit exceeded. Please try again tomorrow.`,
        retryAfter,
      };
    }

    // Increment counters
    minuteData.count++;
    dayData.count++;

    return { success: true };
  }

  checkSearchLimit(userId: string): RateLimitResult {
    return this.checkLimit(
      this.searchLimits,
      userId,
      60, // 60 searches per minute
      500, // 500 searches per day
      'search'
    );
  }

  checkEmailLimit(userId: string): RateLimitResult {
    return this.checkLimit(
      this.emailLimits,
      userId,
      100, // 100 emails per minute
      5000, // 5000 emails per day
      'email'
    );
  }

  // Clean up old entries to prevent memory leaks
  cleanup(): void {
    const now = Date.now();
    const currentMinute = this.getCurrentMinute();
    const currentDay = this.getCurrentDay();

    for (const [key, data] of this.searchLimits.entries()) {
      if (data.resetTime < now) {
        this.searchLimits.delete(key);
      }
    }

    for (const [key, data] of this.emailLimits.entries()) {
      if (data.resetTime < now) {
        this.emailLimits.delete(key);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

export type { RateLimitResult };
