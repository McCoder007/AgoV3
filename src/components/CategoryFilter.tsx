'use client';

import { Category } from '@/lib/types';
import { getCategoryColors } from '@/lib/colorUtils';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

interface CategoryFilterProps {
    categories: Category[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export function CategoryFilter({ categories, selectedId, onSelect }: CategoryFilterProps) {
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

    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide -mx-1 mask-linear-fade">
            <button
                onClick={() => onSelect(null)}
                className={clsx(
                    "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                    selectedId === null
                        ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white"
                        : "bg-transparent text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
            >
                All
            </button>
            {categories.map((cat) => {
                const isSelected = selectedId === cat.id;
                const colors = getCategoryColors(cat.name, cat.color, isDarkMode);
                
                return (
                    <button
                        key={cat.id}
                        onClick={() => onSelect(cat.id)}
                        className={clsx(
                            "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            isSelected
                                ? "shadow-md"
                                : "bg-transparent text-gray-600 border-gray-200 dark:text-gray-400 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        style={isSelected ? {
                            backgroundColor: colors.backgroundColor,
                            color: colors.color,
                            borderColor: isDarkMode ? `${colors.color}40` : colors.backgroundColor,
                        } : undefined}
                    >
                        {cat.name}
                    </button>
                );
            })}
        </div>
    );
}
