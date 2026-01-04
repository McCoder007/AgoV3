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
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={clsx(
                'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                selectedCategory === null
                  ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              All
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const styles = isSelected && cat.color ? getCategoryStyles(cat.color, isDarkMode) : null;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={clsx(
                    'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
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
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

