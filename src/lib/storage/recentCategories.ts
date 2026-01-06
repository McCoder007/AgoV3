const RECENT_CATEGORIES_KEY = 'ago-recent-categories';
const MAX_RECENT = 10;

export interface RecentCategory {
  id: string;
  timestamp: number;
}

export const recentCategoriesRepo = {
  getRecentIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(RECENT_CATEGORIES_KEY);
      if (!saved) return [];
      const parsed: RecentCategory[] = JSON.parse(saved);
      // Sort by timestamp desc and return IDs
      return parsed
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(c => c.id);
    } catch (e) {
      console.error('Failed to load recent categories:', e);
      return [];
    }
  },

  trackUsage(id: string) {
    if (typeof window === 'undefined' || !id) return;
    try {
      const saved = localStorage.getItem(RECENT_CATEGORIES_KEY);
      let recent: RecentCategory[] = saved ? JSON.parse(saved) : [];
      
      // Remove if already exists
      recent = recent.filter(c => c.id !== id);
      
      // Add to front
      recent.unshift({ id, timestamp: Date.now() });
      
      // Trim to max
      recent = recent.slice(0, MAX_RECENT);
      
      localStorage.setItem(RECENT_CATEGORIES_KEY, JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to save recent categories:', e);
    }
  }
};


