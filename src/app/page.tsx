'use client';

import { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { usePreferences } from '@/hooks/useData';
import { useDataContext } from '@/contexts/DataContext';
import { ItemCard } from '@/components/ItemCard';
import { FilterSheet } from '@/components/FilterSheet';
import { SortSheet, SortMethod } from '@/components/SortSheet';
import { SettingsSheet } from '@/components/SettingsSheet';
import { NewItemSheet } from '@/components/NewItemSheet';
import { SearchHeader } from '@/components/SearchHeader';
import { LogEntry } from '@/lib/types';
import { useFilter } from '@/contexts/FilterContext';
import { Plus, Settings } from 'lucide-react';

export default function Home() {
  const { items, itemsLoading, reloadItems, categories, categoriesLoading: catsLoading, reloadCategories, allLogs, logsLoading, reloadLogsForItem } = useDataContext();
  const { prefs } = usePreferences();

  // Initialize state from sessionStorage if available
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ago-selected-category') || null;
    }
    return null;
  });

  const [sortMethod, setSortMethod] = useState<SortMethod>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('ago-sort-method') as SortMethod) || 'recently-done';
    }
    return 'recently-done';
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ago-search-query') || '';
    }
    return '';
  });

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [scrollY, setScrollY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const isRestoringScroll = useRef(false);

  // Track if we need to restore scroll (has saved position) and if restoration is complete
  const [isScrollRestored, setIsScrollRestored] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedScrollY = sessionStorage.getItem('ago-list-scroll-y');
      // If there's a saved scroll position > 0, we need to wait for restoration
      return !savedScrollY || savedScrollY === '0';
    }
    return true;
  });
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

  // Persist filter states to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedCategory) {
        sessionStorage.setItem('ago-selected-category', selectedCategory);
      } else {
        sessionStorage.removeItem('ago-selected-category');
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ago-sort-method', sortMethod);
    }
  }, [sortMethod]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ago-search-query', searchQuery);
    }
  }, [searchQuery]);

  // Debounce search query with 250ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Track scroll position for header shadow and persistence
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      // Don't save if we're at 0 (might be initial load before restoration)
      // or if we're in the middle of restoring
      if (!isRestoringScroll.current && currentScrollY > 0) {
        sessionStorage.setItem('ago-list-scroll-y', currentScrollY.toString());
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // We need to sort items by "most recently done".
  // Logs are now cached in DataContext - derive lastLogs from allLogs
  const lastLogs = useMemo(() => {
    const result: Record<string, LogEntry | undefined> = {};
    for (const [itemId, logs] of Object.entries(allLogs)) {
      result[itemId] = logs[0]; // logs are sorted desc by date
    }
    return result;
  }, [allLogs]);

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  // Check for last viewed item on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastViewedId = sessionStorage.getItem('ago-last-viewed-id');
      if (lastViewedId) {
        setHighlightedItemId(lastViewedId);
        // Clear it so it doesn't highlight again on refresh
        sessionStorage.removeItem('ago-last-viewed-id');

        // Auto-clear highlight after animation
        const timer = setTimeout(() => {
          setHighlightedItemId(null);
        }, 2500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Sorting is ready once logs are loaded
  const sortingReady = !logsLoading;

  // Restore scroll position immediately using layoutEffect (before paint)
  useLayoutEffect(() => {
    if (sortingReady && typeof window !== 'undefined') {
      const savedScrollY = sessionStorage.getItem('ago-list-scroll-y');
      if (savedScrollY && savedScrollY !== '0') {
        isRestoringScroll.current = true;
        window.scrollTo(0, parseInt(savedScrollY, 10));
        // Use requestAnimationFrame to ensure scroll happens before we show content
        requestAnimationFrame(() => {
          isRestoringScroll.current = false;
          setIsScrollRestored(true);
        });
      } else {
        // No scroll to restore, mark as ready immediately
        setIsScrollRestored(true);
      }
    }
  }, [sortingReady]);

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

    const sorted = filtered.sort((a, b) => {
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

    return sorted;
  }, [items, selectedCategory, lastLogs, sortingReady, sortMethod, debouncedSearchQuery, categories, highlightedItemId]);

  if (itemsLoading || catsLoading || !sortingReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-background text-gray-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Calculate active filter count
  const filterActiveCount = selectedCategory ? 1 : 0;
  const sortActive = sortMethod !== 'recently-done';

  return (
    <div
      className="flex flex-col h-full min-h-[100dvh] bg-white dark:bg-background"
      style={{ visibility: isScrollRestored ? 'visible' : 'hidden' }}
    >
      {/* Fixed Header */}
      <div
        ref={headerRef}
        className={`sticky top-0 z-30 ago-sticky-header bg-white dark:bg-background transition-shadow ${scrollY > 0 ? 'shadow-sm border-b border-gray-100 dark:border-gray-800' : ''
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
        paddingTop: '0.5rem',
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
              isHighlighted={highlightedItemId === item.id}
              onDone={(actionType) => {
                // Refresh logic.
                reloadItems();

                if (actionType === 'undo') {
                  setHighlightedItemId(item.id);
                  // Clear highlight after some time
                  setTimeout(() => {
                    setHighlightedItemId(null);
                  }, 800);
                }
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
        onCategoryCreated={reloadCategories}
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
        onSave={(newItemId, logEntry) => {
          // Reload items to include the new item, then reload its logs
          reloadItems();
          if (logEntry) {
            // Reload logs for the new item so it appears sorted correctly
            reloadLogsForItem(newItemId);
          }
          // Highlight the newly created item
          setHighlightedItemId(newItemId);
          setTimeout(() => {
            setHighlightedItemId(null);
          }, 2500);
        }}
        onCategoryCreated={reloadCategories}
      />
    </div>
  );
}
