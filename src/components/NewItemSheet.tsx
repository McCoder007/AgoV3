'use client';

import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { CategoryDropdown } from '@/components/CategoryDropdown';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { useCategories } from '@/hooks/useData';
import clsx from 'clsx';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [dragY, setDragY] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle opening/closing animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTitle('');
      setCategoryId('');
      setDragY(0);
      // Small delay to trigger animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match duration-300
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isAnimating && isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Wait for slide animation
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await itemsRepo.create({
        title: title.trim(),
        categoryId: categoryId || '',
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Swipe to dismiss logic
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
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

  if (!shouldRender) return null;

  return (
    <div 
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-item-title"
    >
      {/* Backdrop */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={clsx(
          "fixed inset-x-0 bottom-0 z-[101] bg-white dark:bg-gray-900 rounded-t-[20px] shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          isAnimating ? "translate-y-0" : "translate-y-full"
        )}
        style={{ 
          height: '65vh',
          transform: isAnimating ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <h2 id="new-item-title" className="text-xl font-bold text-gray-900 dark:text-white">New Item</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                What do you want to track?
              </label>
              <input
                ref={inputRef}
                type="text"
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Water Plants, Oil Change..."
                className="w-full px-4 py-3 text-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Choose a category
              </label>
              <CategoryDropdown
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                onCreateCategory={async (newId) => {
                  await reloadCategories();
                  setCategoryId(newId);
                }}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className={clsx(
                  "w-full px-6 py-4 text-lg font-semibold rounded-xl transition-all min-h-[52px]",
                  "bg-black dark:bg-white text-white dark:text-black",
                  "hover:opacity-90 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                )}
              >
                {isSubmitting ? 'Creating...' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

