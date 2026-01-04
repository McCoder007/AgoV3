'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useItems, useCategories, usePreferences, useLastLog } from '@/hooks/useData';
import { ItemCard } from '@/components/ItemCard';
import { FilterSheet } from '@/components/FilterSheet';
import { SortSheet, SortMethod } from '@/components/SortSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { NewItemSheet } from '@/components/NewItemSheet';
import { SearchHeader } from '@/components/SearchHeader';
import { LogEntry } from '@/lib/types';
import { logsRepo } from '@/lib/storage/logsRepo';
import { useFilter } from '@/contexts/FilterContext';
import { Plus, Settings } from 'lucide-react';

export default function Home() {
  const { items, loading: itemsLoading, reload: reloadItems } = useItems();
  const { categories, loading: catsLoading } = useCategories();
  const { prefs } = usePreferences();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortMethod, setSortMethod] = useState<SortMethod>('recently-done');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [scrollY, setScrollY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const { 
    isFilterSheetOpen, 
    isSortSheetOpen, 
    isSettingsSheetOpen, 
    isNewItemSheetOpen,
    openFilterSheet, 
    openSortSheet, 
    openSettingsSheet, 
    openNewItemSheet,
    closeFilterSheet, 
    closeSortSheet, 
    closeSettingsSheet,
    closeNewItemSheet
  } = useFilter();

  // Debounce search query with 250ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track scroll position for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // We need to sort items by "most recently done".
  // Since useItems only gives items, and ItemCard fetches its own log, we can't easily sort here without fetching logs.
  // Ideally, we should fetch all latest logs here to sort.
  // Strategy: Fetch all latest logs on mount/update? 
  // Optimization: For < 100 items, we can just fetch all "last logs" in a bulk effect here.

  const [lastLogs, setLastLogs] = useState<Record<string, LogEntry | undefined>>({});
  const [allLogs, setAllLogs] = useState<Record<string, LogEntry[]>>({});

  // Effect to fetch all logs when items change.
  // This is a bit "N+1" but local DB is fast.
  const [sortingReady, setSortingReady] = useState(false);

  useMemo(() => {
    async function fetchAllLogs() {
      if (items.length === 0) {
        setSortingReady(true);
        return;
      }
      const logsMap: Record<string, LogEntry[]> = {};
      const lastLogsMap: Record<string, LogEntry | undefined> = {};
      
      await Promise.all(items.map(async (item) => {
        const logs = await logsRepo.listByItem(item.id);
        logsMap[item.id] = logs;
        lastLogsMap[item.id] = logs[0]; // logsRepo.listByItem returns sorted desc by date
      }));
      
      setAllLogs(logsMap);
      setLastLogs(lastLogsMap);
      setSortingReady(true);
    }
    fetchAllLogs();
  }, [items]);

  const sortedItems = useMemo(() => {
    if (!sortingReady) return [];

    let filtered = items;

    // Apply search filter (matches title, category name, and log notes)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const category = categories.find(c => c.id === item.categoryId);
        const categoryName = category?.name || '';
        const titleMatch = item.title.toLowerCase().includes(query);
        const categoryMatch = categoryName.toLowerCase().includes(query);
        
        // Search in log notes
        const itemLogs = allLogs[item.id] || [];
        const noteMatch = itemLogs.some(log => 
          log.note?.toLowerCase().includes(query)
        );

        return titleMatch || categoryMatch || noteMatch;
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
          // Newest First: lastDone desc; Never Done items at bottom
          if (!logA && !logB) return a.title.localeCompare(b.title); // Both never done, alphabetical
          if (!logA) return 1;  // A never done, goes to bottom
          if (!logB) return -1; // B never done, goes to bottom
          // Both have logs, sort by date desc (newest first)
          return logB.date.localeCompare(logA.date);

        case 'oldest-first':
          // Oldest First: lastDone asc; Never Done items at bottom
          if (!logA && !logB) return a.title.localeCompare(b.title); // Both never done, alphabetical
          if (!logA) return 1;  // A never done, goes to bottom
          if (!logB) return -1; // B never done, goes to bottom
          // Both have logs, sort by date asc (oldest first)
          return logA.date.localeCompare(logB.date);

        case 'alphabetical':
          // Alphabetical: title asc; secondary stable sort by lastDone desc
          const titleCompare = a.title.localeCompare(b.title);
          if (titleCompare !== 0) return titleCompare;
          // Titles are equal, secondary sort by lastDone desc
          if (!logA && !logB) return 0;
          if (!logA) return 1;
          if (!logB) return -1;
          return logB.date.localeCompare(logA.date);

        case 'never-done':
          // Never Done: Never Done items first; then lastDone desc
          if (!logA && !logB) return a.title.localeCompare(b.title); // Both never done, alphabetical
          if (!logA) return -1; // A never done, goes first
          if (!logB) return 1;  // B never done, goes first
          // Both have logs, sort by date desc
          return logB.date.localeCompare(logA.date);

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
  const sortActive = sortMethod !== 'recently-done';

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-white dark:bg-black">
      {/* Fixed Header */}
      <div 
        ref={headerRef}
        className={`sticky top-0 z-30 ago-sticky-header bg-white dark:bg-black transition-shadow ${
          scrollY > 0 ? 'shadow-sm border-b border-gray-100 dark:border-gray-800' : ''
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Row 1: Title + Settings */}
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Ago</h1>
          <button
            onClick={openSettingsSheet}
            className="h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Row 2: Search + Filter + Sort */}
        <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <SearchHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={openFilterSheet}
            filterActiveCount={filterActiveCount}
            onSortClick={openSortSheet}
            sortActive={sortActive}
          />
        </div>
      </div>

      {/* Content Area - with padding for header and FAB */}
      <div className="flex-1 px-3 py-2 space-y-2" style={{ 
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
      }}>
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

      {/* Floating Action Button */}
      <button
        onClick={openNewItemSheet}
        className="fixed z-20 flex items-center justify-center w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-lg hover:shadow-xl transition-all active:scale-95"
        style={{
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          right: '16px',
        }}
        aria-label="Add task"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

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
      <NewItemSheet
        isOpen={isNewItemSheetOpen}
        onClose={closeNewItemSheet}
        onSave={reloadItems}
      />
    </div>
  );
}
