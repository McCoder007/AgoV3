'use client';

import { X } from 'lucide-react';
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sort</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all',
                  sortMethod === option.value
                    ? 'bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-black shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

