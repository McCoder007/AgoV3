'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { CategoryPicker } from '@/components/CategoryPicker';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { logsRepo } from '@/lib/storage/logsRepo';
import { recentCategoriesRepo } from '@/lib/storage/recentCategories';
import { useCategories } from '@/hooks/useData';
import { format, parse, isValid, isFuture } from 'date-fns';
import clsx from 'clsx';

const DRAFT_STORAGE_KEY = 'ago-new-item-draft';

interface ItemDraft {
  title: string;
  categoryId: string;
}

const saveDraft = (draft: ItemDraft) => {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
};

const getDraft = (): ItemDraft | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to load draft:', e);
    return null;
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear draft:', e);
  }
};

interface NewItemSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function NewItemSheet({
  isOpen,
  onClose,
  onSave,
}: NewItemSheetProps) {
  const { categories, reload: reloadCategories } = useCategories();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lastDoneInput, setLastDoneInput] = useState('');
  const [lastDoneError, setLastDoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Handle opening/closing animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const draft = getDraft();
      if (draft) {
        setTitle(draft.title);
        setCategoryId(draft.categoryId);
      } else {
        setTitle('');
        setCategoryId('');
      }
      setLastDoneInput('');
      setLastDoneError('');
      setDragY(0);
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
  }, [isOpen]);

  // Save draft
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (title.trim() || categoryId) {
        saveDraft({ title, categoryId });
      } else {
        clearDraft();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [title, categoryId, isOpen]);

  // Focus management
  useEffect(() => {
    if (isAnimating && isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isOpen]);

  // Keyboard and scroll management
  const scrollToDate = () => {
    setTimeout(() => {
      dateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const validateDate = (val: string) => {
    if (!val) {
      setLastDoneError('');
      return true;
    }
    
    // Try mm/dd/yyyy
    const parsed = parse(val, 'MM/dd/yyyy', new Date());
    if (!isValid(parsed)) {
      setLastDoneError('Please use mm/dd/yyyy');
      return false;
    }
    
    if (isFuture(parsed)) {
      setLastDoneError('Date cannot be in the future');
      return false;
    }
    
    setLastDoneError('');
    return true;
  };

  const handleDateBlur = () => {
    validateDate(lastDoneInput);
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // yyyy-mm-dd
    if (val) {
      const date = new Date(val + 'T00:00:00');
      setLastDoneInput(format(date, 'MM/dd/yyyy'));
      setLastDoneError('');
    }
  };

  const formattedDateForDisplay = useMemo(() => {
    if (!lastDoneInput) return '';
    const parsed = parse(lastDoneInput, 'MM/dd/yyyy', new Date());
    if (isValid(parsed)) {
      return format(parsed, 'MMM d, yyyy');
    }
    return '';
  }, [lastDoneInput]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;
    if (!validateDate(lastDoneInput)) return;

    setIsSubmitting(true);
    try {
      const newItem = await itemsRepo.create({
        title: title.trim(),
        categoryId: categoryId || '',
      });

      if (lastDoneInput) {
        const parsed = parse(lastDoneInput, 'MM/dd/yyyy', new Date());
        const dateStr = format(parsed, 'yyyy-MM-dd');
        await logsRepo.add(newItem.id, dateStr);
      }

      if (categoryId) {
        recentCategoriesRepo.trackUsage(categoryId);
      }

      clearDraft();
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Swipe to dismiss
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current?.scrollTop && contentRef.current.scrollTop > 0) return;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  // Category Chips logic
  const recentIds = useMemo(() => recentCategoriesRepo.getRecentIds(), [isOpen]);
  const displayCategories = useMemo(() => {
    const recent = categories.filter(c => recentIds.includes(c.id))
      .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    const others = categories.filter(c => !recentIds.includes(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Show top 8 categories so the 9th slot can be "More..."
    return [...recent, ...others].slice(0, 8);
  }, [categories, recentIds]);

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        className={clsx(
          "relative w-full bg-white dark:bg-gray-900 rounded-t-[20px] shadow-2xl flex flex-col transition-transform duration-300 ease-out max-h-[92vh]",
          isAnimating ? "translate-y-0" : "translate-y-full"
        )}
        style={{ 
          transform: isAnimating ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Handle bar */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New item</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-6 py-6 pb-32"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Item Name */}
            <div className="space-y-3">
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Item name
              </label>
              <input
                ref={inputRef}
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Water Plants, Oil Change, Dentist..."
                className="w-full px-4 py-3.5 text-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Category Chips */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Category (optional)
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

            {/* Last Done Date */}
            <div className="space-y-3">
              <label htmlFor="lastDone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Last done (optional)
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="text"
                  id="lastDone"
                  inputMode="numeric"
                  value={lastDoneInput}
                  onChange={e => {
                    setLastDoneInput(e.target.value);
                    if (lastDoneError) setLastDoneError('');
                  }}
                  onBlur={handleDateBlur}
                  onFocus={scrollToDate}
                  onClick={() => {
                    try {
                      (nativeDateRef.current as any)?.showPicker();
                    } catch (e) {
                      nativeDateRef.current?.focus();
                    }
                  }}
                  placeholder="mm/dd/yyyy"
                  className={clsx(
                    "w-full pl-4 pr-12 py-3.5 text-lg rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 outline-none transition-all",
                    lastDoneError 
                      ? "border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 dark:border-gray-800 focus:ring-blue-500/20 focus:border-blue-500"
                  )}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          (nativeDateRef.current as any)?.showPicker();
                        } catch (e) {
                          nativeDateRef.current?.focus();
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <CalendarIcon size={24} />
                    </button>
                    <input
                      ref={nativeDateRef}
                      type="date"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                      onChange={handleNativeDateChange}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
              </div>
              {lastDoneError && (
                <p className="text-sm font-medium text-red-500 ml-1">{lastDoneError}</p>
              )}
            </div>
          </form>
        </div>

        {/* Sticky Primary Action */}
        <div className="absolute bottom-0 inset-x-0 p-6 pt-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent">
          <div className="max-w-md mx-auto space-y-4">
            {formattedDateForDisplay && !lastDoneError && (
              <p className="text-sm font-medium text-center text-gray-500 dark:text-gray-400 animate-in fade-in slide-in-from-bottom-1">
                Adds an initial completion for {formattedDateForDisplay}.
              </p>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !!lastDoneError}
              className={clsx(
                "w-full px-6 py-4 text-lg font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
                "bg-black dark:bg-white text-white dark:text-black"
              )}
            >
              {isSubmitting ? 'Creating...' : 'Create item'}
            </button>
            <div className="h-safe" />
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
    </div>
  );
}
