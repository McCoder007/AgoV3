'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useItems, useCategories, useItemLogs } from '@/hooks/useData';
import { HistoryList } from '@/components/HistoryList';
import { EditLogModal } from '@/components/EditLogModal';
import { ItemActionsSheet } from '@/components/ItemActionsSheet';
import { EditItemSheet } from '@/components/EditItemSheet';
import { logsRepo } from '@/lib/storage/logsRepo';
import { getTodayDateString, diffDaysDateOnly, parseDateOnly } from '@/lib/dateUtils';
import { LogEntry } from '@/lib/types';
import { getCategoryStyles } from '@/lib/colorUtils';
import Link from 'next/link';
import { ChevronLeft, MoreVertical, Clock, Check } from 'lucide-react';

export default function ItemDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { items, loading: itemsLoading, reload: reloadItems } = useItems();
    const { categories } = useCategories();
    const { logs, reload: reloadLogs } = useItemLogs(id);

    const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
    const [isActionsSheetOpen, setIsActionsSheetOpen] = useState(false);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

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

    const item = items.find(i => i.id === id);
    const category = categories.find(c => c.id === item?.categoryId);
    const categoryStyles = category?.color ? getCategoryStyles(category.color, isDarkMode) : null;
    const lastLog = logs[0]; // logs are sorted desc by date
    const today = getTodayDateString();
    const daysAgo = lastLog ? diffDaysDateOnly(today, lastLog.date) : 0;

    const handleLogClick = (log: LogEntry) => {
        setEditingLog(log);
    };

    const handleSaveLog = async (date: string, note?: string) => {
        if (!editingLog) return;
        await logsRepo.update(editingLog.id, { date, note });
        reloadLogs();
    };

    const handleDone = async () => {
        if (!item) return;
        await logsRepo.add(item.id, getTodayDateString());
        reloadLogs();
    };

    // Format creation date
    const formatCreatedDate = (dateStr: string) => {
        try {
            const d = parseDateOnly(dateStr);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    // Format days ago display
    const formatDaysAgo = (days: number): string => {
        if (days === 0) return 'Today';
        if (days === 1) return '1d ago';
        if (days < 365) return `${days}d ago`;
        const years = Math.floor(days / 365);
        const remainingDays = days % 365;
        return `${years}y ${remainingDays}d ago`;
    };

    if (itemsLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-gray-400">
            <div className="animate-pulse">Loading...</div>
        </div>
    );
    if (!item) return <div className="p-10 text-center">Item not found</div>;

    return (
        <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-black">
            {/* Page Header - minimal */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-xl px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between">
                <Link href="/" className="p-2 -ml-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </Link>
            </header>

            <main className="flex-1 px-5 py-4 pb-24 space-y-8">
                {/* Hero Section - Title, Category Chip */}
                <section className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex-1">
                            {item.title}
                        </h1>
                        <button
                            ref={menuButtonRef}
                            onClick={() => setIsActionsSheetOpen(true)}
                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors -mt-1"
                        >
                            <MoreVertical size={24} />
                        </button>
                    </div>
                    {category && (
                        <span 
                            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                            style={categoryStyles ? { 
                                backgroundColor: categoryStyles.backgroundColor,
                                color: categoryStyles.color,
                                border: isDarkMode ? `1px solid ${categoryStyles.color}20` : 'none'
                            } : {
                                backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                                color: isDarkMode ? '#9ca3af' : '#6b7280'
                            }}
                        >
                            {category.name}
                        </span>
                    )}
                </section>

                {/* Last Done Stat Row */}
                <section>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl px-6 py-5 bg-white dark:bg-gray-900/50 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            {/* Left side: Label, Value, Date */}
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Last done</p>
                                <p className="text-blue-600 dark:text-blue-400 text-3xl font-bold mb-1">
                                    {lastLog ? formatDaysAgo(daysAgo) : 'Never'}
                                </p>
                                {lastLog && (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {parseDateOnly(lastLog.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                )}
                            </div>

                            {/* Right side: Check button */}
                            <div className="flex items-center shrink-0">
                                {/* Primary Check Button */}
                                <button
                                    onClick={handleDone}
                                    disabled={daysAgo === 0}
                                    className="flex items-center justify-center rounded-full transition-all w-12 h-12 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-default"
                                    style={daysAgo === 0
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
                                        if (daysAgo !== 0) {
                                            e.currentTarget.style.backgroundColor = isDarkMode 
                                                ? 'rgba(59, 130, 246, 0.26)' 
                                                : 'rgba(59, 130, 246, 0.16)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (daysAgo !== 0) {
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
                    </div>
                </section>

                {/* History Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-gray-400 dark:text-gray-500" />
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            History
                        </h3>
                    </div>

                    {logs.length === 0 ? (
                        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-900">
                            <p className="text-sm text-gray-400">No history yet</p>
                            <p className="text-xs text-gray-500 mt-1">Use the home page to record your first entry</p>
                        </div>
                    ) : (
                        <HistoryList logs={logs} onLogUpdate={reloadLogs} onLogClick={handleLogClick} />
                    )}
                </section>
            </main>

            {/* Edit Log Modal */}
            <EditLogModal
                isOpen={!!editingLog}
                onClose={() => setEditingLog(null)}
                log={editingLog}
                onSave={handleSaveLog}
            />

            {/* Item Actions Sheet */}
            <ItemActionsSheet
                isOpen={isActionsSheetOpen}
                onClose={() => setIsActionsSheetOpen(false)}
                itemId={id}
                itemTitle={item.title}
                onEdit={() => setIsEditSheetOpen(true)}
                buttonRef={menuButtonRef}
            />

            {/* Edit Item Sheet */}
            <EditItemSheet
                isOpen={isEditSheetOpen}
                onClose={() => setIsEditSheetOpen(false)}
                itemId={id}
                initialTitle={item.title}
                initialCategoryId={item.categoryId}
                onSave={() => {
                    reloadItems();
                }}
            />
        </div>
    );
}
