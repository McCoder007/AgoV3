'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Filter, Plus, Settings, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { useFilter } from '@/contexts/FilterContext';

export function BottomNavigation() {
  const pathname = usePathname();
  const { 
    openFilterSheet, 
    openSortSheet, 
    openSettingsSheet, 
    openNewItemSheet,
    isFilterSheetOpen, 
    isSortSheetOpen, 
    isSettingsSheetOpen,
    isNewItemSheetOpen
  } = useFilter();

  const isHome = pathname === '/';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-background border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="max-w-md mx-auto relative">
        <div className="flex items-center px-2 py-2 h-16">
          {/* Home Button */}
          <Link
            href="/"
            className={clsx(
              'flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-colors flex-1',
              isHome
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Home size={24} />
            <span className="text-xs font-medium">Home</span>
          </Link>

          {/* Filter Button */}
          <button
            onClick={openFilterSheet}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-colors flex-1',
              isFilterSheetOpen
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Filter size={24} />
            <span className="text-xs font-medium">Filter</span>
          </button>

          {/* Add Button - Centered and Elevated */}
          <div className="relative -mt-8 mx-1">
            <button
              onClick={openNewItemSheet}
              className={clsx(
                'flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all',
                'bg-white dark:bg-background text-black dark:text-white',
                'hover:scale-105 active:scale-95',
                'border-2 border-gray-200 dark:border-gray-800',
                isNewItemSheetOpen && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
              )}
            >
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </div>

          {/* Sort Button */}
          <button
            onClick={openSortSheet}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-colors flex-1',
              isSortSheetOpen
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <ArrowUpDown size={24} />
            <span className="text-xs font-medium">Sort</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={openSettingsSheet}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-colors flex-1',
              isSettingsSheetOpen
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            <Settings size={24} />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

