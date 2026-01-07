'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';
import { Category, DEFAULT_CATEGORY_COLORS } from '@/lib/types';
import { categoriesRepo } from '@/lib/storage/categoriesRepo';
import { recentCategoriesRepo } from '@/lib/storage/recentCategories';
import { getCategoryColors } from '@/lib/colorUtils';
import clsx from 'clsx';

interface CategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCategoryCreated: (id: string) => void | Promise<void>;
}

export function CategoryPicker({
  isOpen,
  onClose,
  categories,
  selectedId,
  onSelect,
  onCategoryCreated,
}: CategoryPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setNewCategoryName('');
      setIsCreating(false);
      // Small delay to ensure sheet is visible before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const recentIds = useMemo(() => recentCategoriesRepo.getRecentIds(), [isOpen]);
  
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(query));
  }, [categories, searchQuery]);

  const { recent, all } = useMemo(() => {
    const recentCats = categories.filter(c => recentIds.includes(c.id))
      .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    
    // Sort all alphabetically
    const allCats = [...filteredCategories].sort((a, b) => a.name.localeCompare(b.name));
    
    return { recent: recentCats, all: allCats };
  }, [categories, recentIds, filteredCategories]);

  const findLeastUsedColor = (): string => {
    const colorCounts = new Map<string, number>();
    DEFAULT_CATEGORY_COLORS.forEach(color => colorCounts.set(color, 0));
    categories.forEach(cat => {
      if (cat.color && colorCounts.has(cat.color)) {
        colorCounts.set(cat.color, (colorCounts.get(cat.color) || 0) + 1);
      }
    });
    let leastUsedColor = DEFAULT_CATEGORY_COLORS[0];
    let lowestCount = colorCounts.get(leastUsedColor) || 0;
    for (const [color, count] of colorCounts.entries()) {
      if (count < lowestCount) {
        leastUsedColor = color;
        lowestCount = count;
      }
    }
    return leastUsedColor;
  };

  const handleCreateCategory = async () => {
    const name = searchQuery.trim();
    if (!name) return;
    
    setIsCreating(true);
    try {
      const color = findLeastUsedColor();
      const newCat = await categoriesRepo.create(name, color);
      // Wait for parent to process creation (tracking usage, reloading etc)
      await onCategoryCreated(newCat.id);
      onSelect(newCat.id);
      // Don't close immediately - let parent handle closing after state updates
    } catch (e) {
      console.error('Failed to create category:', e);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  const showCreateOption = searchQuery.trim().length > 0 && 
    !categories.some(c => c.name.toLowerCase() === searchQuery.toLowerCase().trim());

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[200] transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div 
        className="fixed inset-0 z-[201] flex items-center justify-center p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="w-full max-w-[85vw] h-[85vh] max-h-[85vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden"
        >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Category</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search or create category..."
            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {showCreateOption && (
          <button
            onClick={handleCreateCategory}
            disabled={isCreating}
            className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Plus size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900 dark:text-white">Create "{searchQuery}"</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add as a new category</p>
            </div>
          </button>
        )}

        {searchQuery.trim() === '' && recent.length > 0 && (
          <div className="mt-2">
            <h3 className="px-6 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Recent
            </h3>
            {recent.map(cat => (
              <CategoryRow
                key={cat.id}
                category={cat}
                isSelected={selectedId === cat.id}
                onSelect={() => {
                  onSelect(cat.id);
                  onClose();
                }}
              />
            ))}
          </div>
        )}

        <div className="mt-2">
          {searchQuery.trim() === '' && (
            <h3 className="px-6 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              All Categories
            </h3>
          )}
          {all.map(cat => (
            <CategoryRow
              key={cat.id}
              category={cat}
              isSelected={selectedId === cat.id}
              onSelect={() => {
                onSelect(cat.id);
                onClose();
              }}
            />
          ))}
          {all.length === 0 && !showCreateOption && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No categories found
            </div>
          )}
        </div>
      </div>
        </div>
      </div>
    </>
  );
}

function CategoryRow({ 
  category, 
  isSelected, 
  onSelect 
}: { 
  category: Category; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
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

  const colors = getCategoryColors(category.name, category.color, isDarkMode);
  // Use the text color (vibrant color) for the dot
  const dotColor = colors.color;

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "w-full flex items-center gap-3 px-6 py-4 transition-colors text-left",
        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      )}
    >
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0" 
        style={{ backgroundColor: dotColor }}
      />
      <span className={clsx(
        "flex-1 font-medium",
        isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
      )}>
        {category.name}
      </span>
      {isSelected && <Check size={20} className="text-blue-600 dark:text-blue-400" />}
    </button>
  );
}
