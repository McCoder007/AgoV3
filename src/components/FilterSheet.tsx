'use client';

import { Category } from '@/lib/types';
import clsx from 'clsx';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function FilterSheet({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategoryChange,
}: FilterSheetProps) {
  if (!isOpen) return null;

  const handleCategorySelect = (categoryId: string | null) => {
    onCategoryChange(categoryId);
    onClose(); // Close immediately on selection (single select)
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-[25] transition-opacity"
        onClick={onClose}
      />

      {/* Inline Overlay Panel */}
      <div 
        className="fixed left-0 right-0 z-[30] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg max-h-[60vh] overflow-y-auto"
        style={{
          top: 'calc(108px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="px-6 py-6 pb-8">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={clsx(
                'w-full h-11 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center border',
                selectedCategory === null
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              All
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={clsx(
                    'w-full h-11 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center border',
                    isSelected
                      ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

