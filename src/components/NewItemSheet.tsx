'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { CategoryPicker } from '@/components/CategoryPicker';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { logsRepo } from '@/lib/storage/logsRepo';
import { recentCategoriesRepo } from '@/lib/storage/recentCategories';
import { useCategories } from '@/hooks/useData';
import { format, parse, isValid, isFuture } from 'date-fns';
import { LogEntry } from '@/lib/types';
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
  onSave: (newItemId: string, logEntry?: LogEntry) => void;
  onCategoryCreated?: () => void;
}

export function NewItemSheet({
  isOpen,
  onClose,
  onSave,
  onCategoryCreated,
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
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const nativeDateRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isFirstRender = useRef(true);

  // Handle opening/closing animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      
      // Only load from draft when first opening
      if (isFirstRender.current) {
        const draft = getDraft();
        if (draft) {
          setTitle(draft.title);
          setCategoryId(draft.categoryId);
        } else {
          setTitle('');
          setCategoryId('');
        }
        isFirstRender.current = false;
      }
      
      setLastDoneInput('');
      setLastDoneError('');
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      isFirstRender.current = true; // Reset for next time
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

      let logEntry: LogEntry | undefined;
      if (lastDoneInput) {
        const parsed = parse(lastDoneInput, 'MM/dd/yyyy', new Date());
        const logDate = format(parsed, 'yyyy-MM-dd');
        logEntry = await logsRepo.add(newItem.id, logDate);
      }

      if (categoryId) {
        recentCategoriesRepo.trackUsage(categoryId);
      }

      clearDraft();
      onSave(newItem.id, logEntry);
      onClose();
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Category Chips logic
  const recentIds = useMemo(() => recentCategoriesRepo.getRecentIds(), [isOpen, categoryId]);
  const displayCategories = useMemo(() => {
    const recent = categories.filter(c => recentIds.includes(c.id))
      .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    const others = categories.filter(c => !recentIds.includes(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Show top 8 categories so the 9th slot can be "More..."
    return [...recent, ...others].slice(0, 8);
  }, [categories, recentIds]);

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

  if (!shouldRender) return null;

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
            New item
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
          <form onSubmit={handleSubmit} className="pb-8">
            {/* Item Name */}
            <div className="mb-7">
              <label htmlFor="title" className="block text-[13px] font-semibold uppercase mb-3 text-[#6b7280] dark:text-[#9ca3af]" style={{ letterSpacing: '0.5px' }}>
                ITEM NAME
              </label>
              <input
                ref={inputRef}
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Water Plants, Oil Change, Dentist..."
                className="w-full px-5 py-4 text-base rounded-2xl border-none bg-[#f5f7fa] dark:bg-[#2a3142] text-[#1a1f2e] dark:text-white placeholder:opacity-50 placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] outline-none transition-all duration-200 focus:-translate-y-0.5 focus:shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)]"
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
                  const categoryColor = cat.color || '#6b7280';
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(isSelected ? '' : cat.id)}
                      className={clsx(
                        "w-full py-3 px-4 rounded-xl text-sm font-semibold text-center border-none cursor-pointer transition-all duration-200 hover:-translate-y-0.5",
                        isSelected ? "text-white" : "bg-[#f5f7fa] dark:bg-[#2a3142] text-[#6b7280] dark:text-[#9ca3af]"
                      )}
                      style={isSelected ? { backgroundColor: categoryColor } : {}}
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

            {/* Last Done Date */}
            <div className="mb-8">
              <label htmlFor="lastDone" className="block text-[13px] font-semibold uppercase mb-3 text-[#6b7280] dark:text-[#9ca3af]" style={{ letterSpacing: '0.5px' }}>
                LAST DONE
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
                    "w-full pl-5 pr-12 py-4 text-base rounded-2xl border-none bg-[#f5f7fa] dark:bg-[#2a3142] text-[#1a1f2e] dark:text-white placeholder:opacity-50 placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] outline-none transition-all duration-200 focus:-translate-y-0.5",
                    lastDoneError 
                      ? "focus:shadow-[0_4px_12px_rgba(239,68,68,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)]" 
                      : "focus:shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  )}
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)' }}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        (nativeDateRef.current as any)?.showPicker();
                      } catch (e) {
                        nativeDateRef.current?.focus();
                      }
                    }}
                    className="w-5 h-5 flex items-center justify-center opacity-50"
                  >
                    <CalendarIcon size={20} className="text-[#6b7280] dark:text-[#9ca3af]" strokeWidth={2} />
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
              {lastDoneError && (
                <p className="text-sm font-medium text-red-500 mt-2">{lastDoneError}</p>
              )}
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="px-8 pb-8 pt-0 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-4 rounded-2xl text-base font-semibold border-none cursor-pointer transition-all duration-200 bg-transparent text-[#6b7280] dark:text-[#9ca3af] hover:bg-[rgba(107,114,128,0.1)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !!lastDoneError}
              className="flex-1 py-4 px-4 rounded-2xl text-base font-semibold border-none cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#3b82f6] text-white hover:bg-[#2563eb] hover:-translate-y-0.5"
              style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              {isSubmitting ? 'Creating...' : 'Create item'}
            </button>
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
          // Track the new category as recent first so it appears in the grid
          recentCategoriesRepo.trackUsage(newId);
          // Set the category as selected
          setCategoryId(newId);
          // Reload categories to get the updated list
          await reloadCategories();
          // Close the picker after state updates complete
          setIsPickerOpen(false);
          // Call optional callback from Home
          onCategoryCreated?.();
        }}
      />
    </div>
  );
}
