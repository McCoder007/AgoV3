'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CategoryDropdown } from '@/components/CategoryDropdown';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { useCategories } from '@/hooks/useData';

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

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setCategoryId(initialCategoryId);
    }
  }, [isOpen, initialTitle, initialCategoryId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !categoryId) return;

    setIsSubmitting(true);
    try {
      await itemsRepo.update(itemId, {
        title: title.trim(),
        categoryId,
      });
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

            <div className="space-y-4" style={{ position: 'relative' }}>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300">
                Category
              </label>
              <CategoryDropdown
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                onCreateCategory={async (newCategoryId: string) => {
                  await reloadCategories();
                  setCategoryId(newCategoryId);
                }}
              />
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
    </>
  );
}

