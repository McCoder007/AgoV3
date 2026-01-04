'use client';

import { Category } from '@/lib/types';
import { getCategoryStyles } from '@/lib/colorUtils';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CategoryPickerProps {
    categories: Category[];
    selectedId: string | undefined;
    onSelect: (id: string) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
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
        <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
                const isSelected = selectedId === cat.id;
                const styles = isSelected && cat.color ? getCategoryStyles(cat.color, isDarkMode) : null;
                
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id)}
                        className={clsx(
                            "flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all",
                            isSelected
                                ? "shadow-md transform scale-[1.02]"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
                        )}
                        style={isSelected && styles ? {
                            backgroundColor: styles.backgroundColor,
                            color: styles.color,
                            borderColor: isDarkMode ? `${styles.color}40` : styles.backgroundColor,
                        } : isSelected ? {
                            backgroundColor: isDarkMode ? 'white' : '#111827',
                            color: isDarkMode ? 'black' : 'white',
                            borderColor: isDarkMode ? 'white' : '#111827',
                        } : undefined}
                    >
                        <span className="font-medium">{cat.name}</span>
                        {isSelected && <Check size={18} />}
                    </button>
                );
            })}
        </div>
    );
}
