'use client';

import { Check } from 'lucide-react';
import clsx from 'clsx';

export type SortMethod = 'recently-done' | 'alphabetical' | 'oldest-first' | 'never-done';

interface SortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sortMethod: SortMethod;
  onSortChange: (method: SortMethod) => void;
}

export function SortSheet({
  isOpen,
  onClose,
  sortMethod,
  onSortChange,
}: SortSheetProps) {
  if (!isOpen) return null;

  const sortOptions: { value: SortMethod; label: string }[] = [
    { value: 'recently-done', label: 'Newest First' },
    { value: 'oldest-first', label: 'Oldest First' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'never-done', label: 'Never Done' },
  ];

  const handleSortSelect = (method: SortMethod) => {
    onSortChange(method);
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
        className="fixed left-0 right-0 z-[30] bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-lg"
        style={{
          top: 'calc(108px + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="px-4 py-2">
          <div className="space-y-1">
            {sortOptions.map((option) => {
              const isSelected = sortMethod === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSortSelect(option.value)}
                  className={clsx(
                    'w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between',
                    isSelected
                      ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  {isSelected && (
                    <Check size={20} className="flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

