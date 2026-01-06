'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CategoryPicker } from '@/components/CategoryPicker';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { recentCategoriesRepo } from '@/lib/storage/recentCategories';
import { useCategories } from '@/hooks/useData';
import { getCategoryColors } from '@/lib/colorUtils';
import clsx from 'clsx';

interface EditItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  initialTitle: string;
  initialCategoryId: string;
  onSave: () => void;
  onCategoryCreated?: () => void;
}

export function EditItemSheet({
  isOpen,
  onClose,
  itemId,
  initialTitle,
  initialCategoryId,
  onSave,
  onCategoryCreated,
}: EditItemSheetProps) {
  const router = useRouter();
  const { categories, reload: reloadCategories } = useCategories();
  const [title, setTitle] = useState(initialTitle);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect dark mode
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

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setCategoryId(initialCategoryId);
      setShowDeleteConfirm(false);
      setShouldRender(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialTitle, initialCategoryId]);

  // Focus management
  useEffect(() => {
    if (isAnimating && isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const isChanged = title.trim() !== initialTitle || categoryId !== initialCategoryId;

  // Category Chips logic
  const recentIds = useMemo(() => recentCategoriesRepo.getRecentIds(), [isOpen]);
  const displayCategories = useMemo(() => {
    const recent = categories.filter(c => recentIds.includes(c.id))
      .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    const others = categories.filter(c => !recentIds.includes(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return [...recent, ...others].slice(0, 8);
  }, [categories, recentIds]);

  if (!shouldRender) return null;

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

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await itemsRepo.delete(itemId);
      onClose();
      router.replace('/');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          "fixed inset-0 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={clsx(
          "relative w-full max-w-[500px] bg-white dark:bg-[#1e2530] rounded-[24px] flex flex-col transition-all duration-300 ease-out max-h-[90vh] modal-shadow",
          isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-0 shrink-0">
          <h2 className="text-[28px] font-bold leading-tight text-[#1a1f2e] dark:text-white mb-8" style={{ letterSpacing: '-0.5px' }}>
            Edit Item
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#f5f7fa] dark:bg-[#2a3142] text-[#6b7280] dark:text-[#9ca3af] flex items-center justify-center transition-all duration-200 hover:bg-[#e5e7eb] dark:hover:bg-[#3a4152] hover:rotate-90"
            aria-label="Close"
          >
            <span className="text-2xl leading-none" style={{ fontSize: '24px' }}>✕</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-8"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="pb-8">
            {/* Item Name */}
            <div className="mb-7">
              <label htmlFor="edit-title" className="block text-[13px] font-semibold uppercase mb-3 text-[#6b7280] dark:text-[#9ca3af]" style={{ letterSpacing: '0.5px' }}>
                ITEM NAME
              </label>
              <input
                ref={inputRef}
                type="text"
                id="edit-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-5 py-4 text-base rounded-2xl border-none bg-[#f5f7fa] dark:bg-[#2a3142] text-[#1a1f2e] dark:text-white outline-none transition-all duration-200 focus:-translate-y-0.5 focus:shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)]"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)' }}
                autoFocus
              />
            </div>

            {/* Category Chips */}
            <div className="mb-7">
              <label className="block text-[13px] font-semibold uppercase mb-3 text-[#6b7280] dark:text-[#9ca3af]" style={{ letterSpacing: '0.5px' }}>
                CATEGORY
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {displayCategories.map(cat => {
                  const isSelected = categoryId === cat.id;
                  const colors = getCategoryColors(cat.name, cat.color, isDarkMode);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(isSelected ? '' : cat.id)}
                      className={clsx(
                        "w-full py-3 px-4 rounded-xl text-sm font-semibold text-center border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5",
                        isSelected ? "" : "bg-[#f5f7fa] dark:bg-[#2a3142] text-[#6b7280] dark:text-[#9ca3af]"
                      )}
                      style={isSelected ? { 
                        backgroundColor: colors.color,
                        color: '#FFFFFF'
                      } : {}}
                    >
                      <span className="truncate block">{cat.name}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-center bg-transparent border-2 border-dashed border-[#d1d5db] dark:border-[#4b5563] text-[#6b7280] dark:text-[#9ca3af] cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                >
                  More...
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-10">
              <div className="text-center mb-4">
                <span className="text-[11px] font-bold uppercase text-[#ef4444]" style={{ letterSpacing: '1px' }}>
                  DANGER ZONE
                </span>
              </div>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-base font-semibold border-2 bg-transparent text-[#ef4444] border-[#fecaca] dark:border-[rgba(239,68,68,0.3)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fef2f2] dark:hover:bg-[rgba(239,68,68,0.1)] hover:border-[#fca5a5] dark:hover:border-[rgba(239,68,68,0.5)] mb-6"
              >
                <Trash2 size={20} />
                Delete Item
              </button>
            </div>

            {/* Save Changes Button */}
            <div className="mt-6">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !title.trim() || !categoryId || !isChanged}
                className="w-full py-4 px-4 rounded-2xl text-base font-semibold border-none cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#3b82f6] text-white hover:bg-[#2563eb] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(59,130,246,0.4)]"
                style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white dark:bg-[#1e2530] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 modal-shadow">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} className="text-red-600 dark:text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#1a1f2e] dark:text-white mb-2">
                Delete "{initialTitle}"?
              </h3>
              <p className="text-[#6b7280] dark:text-[#9ca3af]">
                This removes the item and its history. This action cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-5 text-[#6b7280] dark:text-[#9ca3af] font-bold hover:bg-[#f5f7fa] dark:hover:bg-[#2a3142] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-5 bg-red-600 dark:bg-red-500 text-white font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <CategoryPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onCategoryCreated={async (newId) => {
          await reloadCategories();
          setCategoryId(newId);
          onCategoryCreated?.();
        }}
      />
    </div>
  );
}

