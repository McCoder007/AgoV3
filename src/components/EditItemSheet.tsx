'use client';

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { CategoryPicker } from '@/components/CategoryPicker';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { recentCategoriesRepo } from '@/lib/storage/recentCategories';
import { useCategories } from '@/hooks/useData';
import clsx from 'clsx';

interface EditItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  initialTitle: string;
  initialCategoryId: string;
  onSave: () => void;
}

export function EditItemSheet({
  isOpen,
  onClose,
  itemId,
  initialTitle,
  initialCategoryId,
  onSave,
}: EditItemSheetProps) {
  const { categories, reload: reloadCategories } = useCategories();
  const [title, setTitle] = useState(initialTitle);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setCategoryId(initialCategoryId);
    }
  }, [isOpen, initialTitle, initialCategoryId]);

  // Category Chips logic
  const recentIds = useMemo(() => recentCategoriesRepo.getRecentIds(), [isOpen]);
  const displayCategories = useMemo(() => {
    const recent = categories.filter(c => recentIds.includes(c.id))
      .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    const others = categories.filter(c => !recentIds.includes(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return [...recent, ...others].slice(0, 8);
  }, [categories, recentIds]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !categoryId) return;

    setIsSubmitting(true);
    try {
      await itemsRepo.update(itemId, {
        title: title.trim(),
        categoryId,
      });
      if (categoryId) {
        recentCategoriesRepo.trackUsage(categoryId);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[55] transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[60] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out h-[92vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 pb-40">
          <div className="space-y-10">
            <div className="space-y-4">
              <label htmlFor="edit-title" className="block text-base font-semibold text-gray-700 dark:text-gray-300">
                Item Name
              </label>
              <input
                type="text"
                id="edit-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-4 text-xl rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                autoFocus
              />
            </div>

            <div className="space-y-4">
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {displayCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                    className={clsx(
                      "w-full h-11 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center border",
                      categoryId === cat.id
                        ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    <span className="truncate">{cat.name}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="w-full h-11 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center border bg-gray-50 text-gray-500 border-dashed border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  More...
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !categoryId}
                className="w-full px-6 py-5 rounded-2xl bg-blue-600 dark:bg-blue-500 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-lg active:scale-[0.98]"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CategoryPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onCategoryCreated={async (newId) => {
          await reloadCategories();
          setCategoryId(newId);
        }}
      />
    </>
  );
}

