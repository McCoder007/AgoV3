'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useDataContext } from '@/contexts/DataContext';
import { HistoryList } from '@/components/HistoryList';

const EditLogModal = dynamic(
    () => import('@/components/EditLogModal').then(m => ({ default: m.EditLogModal })),
    { ssr: false }
);

const EditItemSheet = dynamic(
    () => import('@/components/EditItemSheet').then(m => ({ default: m.EditItemSheet })),
    { ssr: false }
);
import { logsRepo } from '@/lib/storage/logsRepo';
import { getTodayDateString, diffDaysDateOnly, parseDateOnly } from '@/lib/dateUtils';
import { LogEntry } from '@/lib/types';
import { CategoryPill } from '@/components/CategoryPill';
import Link from 'next/link';
import { ChevronLeft, Pencil, Clock, Check } from 'lucide-react';
import { useMemo } from 'react';

export default function ItemDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { items, itemsLoading, reloadItems, categories, reloadCategories, getLogsForItem, reloadLogsForItem } = useDataContext();

    // Use cached logs from context (instant!)
    const logs = getLogsForItem(id);

    const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
    const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

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
    const lastLog = logs[0]; // logs are sorted desc by date
    const today = getTodayDateString();
    const daysAgo = lastLog ? diffDaysDateOnly(today, lastLog.date) : 0;

    // Calculate statistics
    const stats = useMemo(() => {
        if (logs.length === 0) return { average: 0, total: 0, shortest: 0 };
        if (logs.length === 1) return { average: 0, total: 1, shortest: 0 };

        const gaps: number[] = [];
        for (let i = 0; i < logs.length - 1; i++) {
            // logs are sorted desc, so logs[i] is newer than logs[i+1]
            gaps.push(diffDaysDateOnly(logs[i].date, logs[i + 1].date));
        }

        const totalGap = gaps.reduce((sum, gap) => sum + gap, 0);
        const average = Math.round(totalGap / gaps.length);
        const shortest = Math.min(...gaps);

        return { average, total: logs.length, shortest };
    }, [logs]);

    const handleLogClick = (log: LogEntry) => {
        setEditingLog(log);
    };

    const handleSaveLog = async (date: string, note?: string) => {
        if (!editingLog) return;
        await logsRepo.update(editingLog.id, { date, note });
        reloadLogsForItem(id);
    };

    const handleDone = async () => {
        if (!item) return;
        await logsRepo.add(item.id, getTodayDateString());
        reloadLogsForItem(id);
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

    // Format stat value (Average/Shortest)
    const formatStatValue = (value: number) => {
        if (value === 0) return '-';

        return (
            <>
                {value}<span className="text-xs ml-1 opacity-70">{value === 1 ? 'day' : 'days'}</span>
            </>
        );
    };

    if (itemsLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-gray-400">
            <div className="animate-pulse font-sans">Loading...</div>
        </div>
    );
    if (!item) return <div className="p-10 text-center font-sans">Item not found</div>;

    return (
        <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-black font-sans">
            {/* Header Section */}
            <header className="flex flex-col">
                <div className="px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-5 border-b border-border-color dark:border-border-color bg-linear-to-b from-[#f8fafb] to-white dark:from-[#1c1c1e] dark:to-black">
                    <div className="flex justify-between items-center mb-5">
                        <Link href="/" className="text-[15px] font-semibold text-primary-blue">
                            ← Back
                        </Link>
                        <button
                            onClick={() => setIsEditSheetOpen(true)}
                            className="flex items-center justify-center min-w-[44px] min-h-[44px] text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-white transition-colors"
                        >
                            <Pencil size={20} />
                        </button>
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                            <h1 className="text-2xl font-bold leading-tight tracking-[-0.3px] text-text-primary dark:text-white mb-2 line-clamp-3">
                                {item.title}
                            </h1>
                            {category && (
                                <CategoryPill categoryName={category.name} customColor={category.color} isDark={isDarkMode} />
                            )}
                        </div>

                        <div className="text-right shrink-0">
                            <p className="text-[56px] font-extrabold leading-none tracking-[-1px] text-primary-blue">
                                {lastLog ? daysAgo : '--'}
                            </p>
                            <p className="text-xs -mt-1 text-text-secondary dark:text-text-secondary">
                                days ago
                            </p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mt-5 flex gap-3 p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-border-color dark:border-border-color">
                        <div className="flex-1 text-center py-2">
                            <p className="text-xl font-bold text-text-primary dark:text-white mb-1 flex items-baseline justify-center">
                                {formatStatValue(stats.average)}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-text-tertiary dark:text-text-secondary">Average</p>
                        </div>
                        <div className="flex-1 text-center py-2">
                            <p className="text-xl font-bold text-text-primary dark:text-white mb-1">{stats.total}</p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-text-tertiary dark:text-text-secondary">Total</p>
                        </div>
                        <div className="flex-1 text-center py-2">
                            <p className="text-xl font-bold text-text-primary dark:text-white mb-1 flex items-baseline justify-center">
                                {formatStatValue(stats.shortest)}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-text-tertiary dark:text-text-secondary">Shortest</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Action Section */}
                <section className="px-6 pt-6 pb-4 bg-white dark:bg-black">
                    {daysAgo === 0 && lastLog ? (
                        <div className="w-[75%] mx-auto mb-6 py-[14px] bg-transparent text-text-secondary dark:text-text-secondary rounded-xl text-base font-medium flex items-center justify-center gap-2">
                            <span className="text-2xl text-[#10b981]">✓</span>
                            Completed today
                        </div>
                    ) : (
                        <button
                            onClick={handleDone}
                            className="w-[75%] mx-auto mb-4
                                bg-gradient-to-br from-sky-500/[0.12] to-blue-500/[0.15]
                                dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-sky-500/[0.15]
                                border border-sky-500/25 dark:border-blue-500/30
                                rounded-xl
                                px-8 py-[18px]
                                text-sky-500 dark:text-white
                                text-base font-medium
                                shadow-[0_2px_8px_rgba(14,165,233,0.08)] dark:shadow-[0_4px_12px_rgba(59,130,246,0.1),0_2px_4px_rgba(0,0,0,0.3)]
                                backdrop-blur-[10px]
                                flex items-center justify-center gap-2.5
                                transition-all duration-300
                                hover:bg-gradient-to-br hover:from-sky-500/[0.18] hover:to-blue-500/20
                                dark:hover:bg-gradient-to-br dark:hover:from-blue-500/[0.15] dark:hover:to-sky-500/20
                                hover:border-sky-500/35 dark:hover:border-blue-500/50
                                hover:shadow-[0_4px_12px_rgba(14,165,233,0.12)] dark:hover:shadow-[0_6px_16px_rgba(59,130,246,0.2),0_2px_4px_rgba(0,0,0,0.4)]
                                hover:-translate-y-px
                                active:translate-y-0
                                active:shadow-[0_2px_6px_rgba(14,165,233,0.1)] dark:active:shadow-[0_4px_10px_rgba(59,130,246,0.15),0_2px_4px_rgba(0,0,0,0.3)]
                                cursor-pointer"
                        >
                            <svg className="w-5 h-5 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            I Just Did This
                        </button>
                    )}
                </section>

                {/* History Section */}
                <section className="bg-white dark:bg-black">
                    <h3 className="px-6 pt-0 pb-4 text-xl font-bold text-text-primary dark:text-white">
                        History
                    </h3>

                    <div className="px-6 pb-24">
                        {logs.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border-color dark:border-border-color">
                                <p className="text-sm text-text-secondary dark:text-text-secondary">No history yet</p>
                                <p className="text-xs text-text-tertiary mt-1">Record your first entry above</p>
                            </div>
                        ) : (
                            <HistoryList logs={logs} onLogUpdate={() => reloadLogsForItem(id)} onLogClick={handleLogClick} />
                        )}
                    </div>
                </section>
            </main>

            {/* Edit Log Modal */}
            <EditLogModal
                isOpen={!!editingLog}
                onClose={() => setEditingLog(null)}
                log={editingLog}
                onSave={handleSaveLog}
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
                onCategoryCreated={reloadCategories}
            />
        </div>
    );
}
