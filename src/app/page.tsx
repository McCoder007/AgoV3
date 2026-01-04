'use client';

import { useState, useMemo, useEffect } from 'react';
import { useItems, useCategories, usePreferences, useLastLog } from '@/hooks/useData';
import { ItemCard } from '@/components/ItemCard';
import { FilterSheet } from '@/components/FilterSheet';
import { SortSheet, SortMethod } from '@/components/SortSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { SearchHeader } from '@/components/SearchHeader';
import { LogEntry } from '@/lib/types';
import { logsRepo } from '@/lib/storage/logsRepo';
import { useFilter } from '@/contexts/FilterContext';
import { Plus } from 'lucide-react';

export default function Home() {
  const { items, loading: itemsLoading, reload: reloadItems } = useItems();
  const { categories, loading: catsLoading } = useCategories();
  const { prefs } = usePreferences();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<SortMethod>('recently-done');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const { isFilterSheetOpen, isSortSheetOpen, isSettingsSheetOpen, openFilterSheet, closeFilterSheet, closeSortSheet, closeSettingsSheet } = useFilter();

  // Debounce search query with 250ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // We need to sort items by "most recently done".
  // Since useItems only gives items, and ItemCard fetches its own log, we can't easily sort here without fetching logs.
  // Ideally, we should fetch all latest logs here to sort.
  // Strategy: Fetch all latest logs on mount/update? 
  // Optimization: For < 100 items, we can just fetch all "last logs" in a bulk effect here.

  const [lastLogs, setLastLogs] = useState<Record<string, LogEntry | undefined>>({});

  // Effect to fetch all last logs when items change.
  // This is a bit "N+1" but local DB is fast.
  const [sortingReady, setSortingReady] = useState(false);

  useMemo(() => {
    async function fetchAllLogs() {
      if (items.length === 0) {
        setSortingReady(true);
        return;
      }
      const logsMap: Record<string, LogEntry | undefined> = {};
      await Promise.all(items.map(async (item) => {
        const log = await logsRepo.getLastLog(item.id);
        logsMap[item.id] = log;
      }));
      setLastLogs(logsMap);
      setSortingReady(true);
    }
    fetchAllLogs();
  }, [items]);

  const sortedItems = useMemo(() => {
    if (!sortingReady) return [];

    let filtered = items;

    // Apply search filter (matches both title and category name)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const category = categories.find(c => c.id === item.categoryId);
        const categoryName = category?.name || '';
        const titleMatch = item.title.toLowerCase().includes(query);
        const categoryMatch = categoryName.toLowerCase().includes(query);
        return titleMatch || categoryMatch;
      });
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(i => i.categoryId === selectedCategory);
    }

    return filtered.sort((a, b) => {
      const logA = lastLogs[a.id];
      const logB = lastLogs[b.id];

      switch (sortMethod) {
        case 'recently-done':
          // Sort by date desc (newest first)
          if (logA && logB) return logB.date.localeCompare(logA.date);
          if (logA && !logB) return -1; // A has log, goes first
          if (!logA && logB) return 1;  // B has log, goes first
          // Fallback to alphabetical
          return a.title.localeCompare(b.title);

        case 'oldest-first':
          // Sort by date asc (oldest first)
          if (logA && logB) return logA.date.localeCompare(logB.date);
          if (logA && !logB) return 1; // A has log, goes after items without logs
          if (!logA && logB) return -1; // B has log, goes after items without logs
          // Fallback to alphabetical
          return a.title.localeCompare(b.title);

        case 'never-done':
          // Items without logs first, then by date desc
          if (!logA && !logB) return a.title.localeCompare(b.title);
          if (!logA && logB) return -1; // A has no log, goes first
          if (logA && !logB) return 1;  // B has no log, goes first
          // Both have logs, sort by date desc
          return logB.date.localeCompare(logA.date);

        case 'alphabetical':
          // Sort alphabetically by title
          return a.title.localeCompare(b.title);

        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [items, selectedCategory, lastLogs, sortingReady, sortMethod, debouncedSearchQuery, categories]);

  if (itemsLoading || catsLoading || !sortingReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-gray-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Calculate active filter count
  const filterActiveCount = selectedCategory ? 1 : 0;

  return (
    <div className="flex flex-col h-full min-h-screen bg-white dark:bg-black">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <header className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Ago</h1>
          </div>
        </header>

        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterClick={openFilterSheet}
          filterActiveCount={filterActiveCount}
        />
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No items yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Add an item to start tracking when you last did it.
            </p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 px-6">
            {debouncedSearchQuery.trim() || selectedCategory
              ? 'No items found matching your search or filters.'
              : 'No items in this category.'}
          </div>
        ) : (
          sortedItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              density={prefs.density}
              onDone={() => {
                // Refresh logic.
                // We need to reload Items (to trigger sort re-calc) or just update local logs state.
                // Triggering item reload is safe.
                reloadItems();
                // Also update local logs immediately?
                // The ItemCard updates itself, but the list sort order won't change until `items` or `lastLogs` changes.
                // We'll trust `reloadItems` to trigger re-render, 
                // but actually `items` array might be same so effect won't run if reference equality holds?
                // `itemsRepo.getAll` returns new array.
                // So it will trigger `fetchAllLogs`.
              }}
            />
          ))
        )}
      </div>

      <FilterSheet
        isOpen={isFilterSheetOpen}
        onClose={closeFilterSheet}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <SortSheet
        isOpen={isSortSheetOpen}
        onClose={closeSortSheet}
        sortMethod={sortMethod}
        onSortChange={setSortMethod}
      />
      <SettingsSheet
        isOpen={isSettingsSheetOpen}
        onClose={closeSettingsSheet}
      />
    </div>
  );
}
