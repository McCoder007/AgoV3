'use client';

import { Category, DEFAULT_CATEGORY_COLORS } from '@/lib/types';
import clsx from 'clsx';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { categoriesRepo } from '@/lib/storage/categoriesRepo';

interface CategoryDropdownProps {
    categories: Category[];
    selectedId: string | undefined;
    onSelect: (id: string) => void;
    onCreateCategory?: (categoryId: string) => void;
}

export function CategoryDropdown({ categories, selectedId, onSelect, onCreateCategory }: CategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sort categories alphabetically
    const sortedCategories = [...categories].sort((a, b) => 
        a.name.localeCompare(b.name)
    );

    const selectedCategory = sortedCategories.find(cat => cat.id === selectedId);

    // Helper function to find the least-used color from the palette
    const findLeastUsedColor = (): string => {
        // Count how many categories use each color
        const colorCounts = new Map<string, number>();
        DEFAULT_CATEGORY_COLORS.forEach(color => {
            colorCounts.set(color, 0);
        });

        categories.forEach(cat => {
            if (cat.color && colorCounts.has(cat.color)) {
                colorCounts.set(cat.color, (colorCounts.get(cat.color) || 0) + 1);
            }
        });

        // Find the color with the lowest count
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

    // Handle creating a new category
    const handleCreateCategory = async () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) return;

        try {
            const selectedColor = findLeastUsedColor();
            const newCategory = await categoriesRepo.create(trimmedName, selectedColor);
            
            // Clear input
            setNewCategoryName('');
            
            // Notify parent
            if (onCreateCategory) {
                onCreateCategory(newCategory.id);
            }
            
            // Auto-select the new category
            onSelect(newCategory.id);
            
            // Close dropdown
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to create category:', error);
        }
    };

    // Handle Enter key in input
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCreateCategory();
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                buttonRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen]);

    // Close dropdown on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => {
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen]);

    const handleSelect = (id: string | null) => {
        onSelect(id || '');
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between px-4 py-3.5 text-lg rounded-xl border outline-none min-h-[44px]",
                    "bg-white border-gray-200 text-gray-900 dark:bg-gray-900 dark:border-gray-800 dark:text-white",
                    "hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700",
                    "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    isOpen && "border-blue-500 ring-2 ring-blue-500/20"
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className={clsx(
                    "font-medium text-lg",
                    !selectedCategory && "text-gray-400 dark:text-gray-500"
                )}>
                    {selectedCategory?.name || 'Choose a category'}
                </span>
                <ChevronDown
                    size={22}
                    className={clsx(
                        "transition-transform text-gray-500 dark:text-gray-400",
                        isOpen && "transform rotate-180"
                    )}
                />
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Dropdown Menu */}
            <div
                ref={dropdownRef}
                className={clsx(
                    "absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg",
                    "transition-all duration-200 ease-out flex flex-col",
                    isOpen 
                        ? "opacity-100 translate-y-0 pointer-events-auto" 
                        : "opacity-0 -translate-y-2 pointer-events-none"
                )}
                role="listbox"
            >
                <div className="max-h-64 overflow-y-auto">
                    {/* None option */}
                    <button
                        type="button"
                        onClick={() => handleSelect(null)}
                        className={clsx(
                            "w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors min-h-[44px]",
                            "first:rounded-t-xl",
                            !selectedId
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                        )}
                        role="option"
                        aria-selected={!selectedId}
                    >
                        <span className="font-medium text-gray-400 dark:text-gray-500">None</span>
                        {!selectedId && (
                            <Check size={18} className="text-blue-600 dark:text-blue-400" />
                        )}
                    </button>
                    {sortedCategories.map((cat) => {
                        const isSelected = selectedId === cat.id;
                        
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelect(cat.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between px-4 py-3.5 text-left min-h-[44px]",
                                    isSelected
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                        : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                                )}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span className="font-medium">{cat.name}</span>
                                {isSelected && (
                                    <Check 
                                        size={18} 
                                        className="text-blue-600 dark:text-blue-400"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Create new category input - always visible at bottom */}
                <div className="border-t border-gray-200 dark:border-gray-800 rounded-b-xl">
                    <div className="p-2 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="Create new category..."
                            className={clsx(
                                "flex-1 px-3 py-2 text-sm rounded-lg border transition-all outline-none",
                                "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                                "text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            )}
                        />
                        <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={!newCategoryName.trim()}
                            className={clsx(
                                "p-2 rounded-lg transition-all",
                                "text-blue-600 dark:text-blue-400",
                                "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                                "active:bg-blue-100 dark:active:bg-blue-900/30",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            )}
                            title="Create category"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

