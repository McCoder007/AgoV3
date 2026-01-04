'use client';

import React, { useEffect, useState } from 'react';
import { Item } from '@/lib/types';
import { useLastLog, useCategories } from '@/hooks/useData';
import { diffDaysDateOnly, getTodayDateString } from '@/lib/dateUtils';
import { getCategoryStyles } from '@/lib/colorUtils';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { logsRepo } from '@/lib/storage/logsRepo';

interface ItemCardProps {
    item: Item;
    onDone?: () => void;
    density: 'regular' | 'compact';
}

export function ItemCard({ item, onDone, density }: ItemCardProps) {
    const { lastLog, loading, reload } = useLastLog(item.id);
    const { categories } = useCategories();
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

    const category = categories.find(c => c.id === item.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    const categoryStyles = category?.color ? getCategoryStyles(category.color, isDarkMode) : null;

    const handleDone = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await logsRepo.add(item.id, getTodayDateString());
        reload();
        onDone?.();
    };

    let daysSince: number | 'Never' = 'Never';
    let isToday = false;

    if (lastLog) {
        const diff = diffDaysDateOnly(getTodayDateString(), lastLog.date);
        daysSince = diff;
        isToday = diff === 0;
    }

    const isCompact = density === 'compact';

    return (
        <Link href={`/items/${item.id}`} className={`block group relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900/50 border transition-all active:scale-[0.98] ${isCompact ? 'px-3 py-3' : 'px-4 py-4'}`} style={{
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
            boxShadow: isDarkMode ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}>
            <div className="flex justify-between items-center gap-4">
                {/* Left Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="leading-none">
                        <span 
                            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                            style={categoryStyles ? { 
                                color: categoryStyles.color,
                                backgroundColor: categoryStyles.backgroundColor,
                                border: isDarkMode ? `1px solid ${categoryStyles.color}20` : 'none'
                            } : {
                                color: isDarkMode ? '#9CA3AF' : '#6B7280',
                                backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6'
                            }}
                        >
                            {categoryName}
                        </span>
                    </div>
                    <h3 className={`font-bold text-gray-900 dark:text-gray-100 truncate leading-tight ${isCompact ? 'text-lg' : 'text-xl'}`}>
                        {item.title}
                    </h3>
                </div>

                {/* Right Content */}
                <div className="flex items-center gap-4 shrink-0">
                    {/* Metric Group */}
                    <div className="flex flex-col items-end leading-none">
                        {daysSince === 'Never' ? (
                            <div className="w-8 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full" />
                        ) : (
                            <>
                                <span className="font-semibold text-2xl text-gray-900 dark:text-white leading-none">
                                    {daysSince}
                                </span>
                                <span className="text-[11px] font-medium text-gray-600/60 dark:text-gray-400/60 uppercase tracking-tight mt-1 leading-none">
                                    {daysSince === 1 ? 'DAY AGO' : 'DAYS AGO'}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Action Button: Tonal IconButton with Check icon */}
                    <button
                        onClick={handleDone}
                        disabled={loading || isToday}
                        className="flex items-center justify-center rounded-[18px] transition-all w-12 h-12 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-default"
                        style={loading || isToday 
                            ? {
                                backgroundColor: isDarkMode ? 'rgba(156, 163, 175, 0.08)' : 'rgba(156, 163, 175, 0.06)',
                                border: `1px solid ${isDarkMode ? 'rgba(156, 163, 175, 0.12)' : 'rgba(156, 163, 175, 0.10)'}`,
                                color: isDarkMode ? 'rgba(156, 163, 175, 0.35)' : 'rgba(107, 114, 128, 0.35)'
                            }
                            : {
                                backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.10)',
                                border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.27)' : 'rgba(59, 130, 246, 0.21)'}`,
                                color: '#3B82F6',
                                outlineColor: isDarkMode ? 'rgba(59, 130, 246, 0.40)' : 'rgba(59, 130, 246, 0.40)'
                            }
                        }
                        onMouseEnter={(e) => {
                            if (!loading && !isToday) {
                                e.currentTarget.style.backgroundColor = isDarkMode 
                                    ? 'rgba(59, 130, 246, 0.26)' 
                                    : 'rgba(59, 130, 246, 0.16)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && !isToday) {
                                e.currentTarget.style.backgroundColor = isDarkMode 
                                    ? 'rgba(59, 130, 246, 0.18)' 
                                    : 'rgba(59, 130, 246, 0.10)';
                            }
                        }}
                    >
                        <Check size={23} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </Link>
    );
}
