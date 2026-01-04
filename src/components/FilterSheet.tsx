'use client';

import { Category } from '@/lib/types';
import { getCategoryStyles } from '@/lib/colorUtils';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Filter</h2>
          <div className="flex items-center gap-2">
            {selectedCategory !== null && (
              <button
                onClick={() => onCategoryChange(null)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <div className="space-y-2">
            <button
              onClick={() => onCategoryChange(null)}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl border transition-all',
                selectedCategory === null
                  ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <span className="font-medium">All</span>
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const styles = isSelected && cat.color ? getCategoryStyles(cat.color, isDarkMode) : null;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border transition-all',
                    isSelected && !styles
                      ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md'
                      : !isSelected
                      ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
                      : 'shadow-md'
                  )}
                  style={isSelected && styles ? {
                    backgroundColor: styles.backgroundColor,
                    color: styles.color,
                    borderColor: styles.backgroundColor,
                  } : undefined}
                >
                  <span className="font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

