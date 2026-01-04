import { LogEntry } from '@/lib/types';
import { diffDaysDateOnly, formatInterval, parseDateOnly, getTodayDateString } from '@/lib/dateUtils';
import { Trash2 } from 'lucide-react';
import { logsRepo } from '@/lib/storage/logsRepo';

interface HistoryListProps {
    logs: LogEntry[];
    onLogUpdate: () => void;
    onLogClick?: (log: LogEntry) => void;
}

export function HistoryList({ logs, onLogUpdate, onLogClick }: HistoryListProps) {
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click
        if (confirm('Are you sure you want to delete this entry?')) {
            await logsRepo.delete(id);
            onLogUpdate();
        }
    };

    // Calculate intervals between consecutive entries
    const intervals = logs.length > 1 ? logs.slice(0, -1).map((log, index) => {
        const nextLog = logs[index + 1];
        const deltaDays = diffDaysDateOnly(log.date, nextLog.date);
        return {
            interval: formatInterval(deltaDays),
            fromDate: log.date,
            toDate: nextLog.date,
            fromDateFormatted: parseDateOnly(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            toDateFormatted: parseDateOnly(nextLog.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        };
    }) : [];

    // Constants for consistent spacing
    const DOT_SIZE = 12; // w-3 h-3 = 12px
    const DOT_TOP_OFFSET = 4; // Offset from top of row to align with text
    const INTERVAL_HEIGHT = 56; // h-14 = 56px

    return (
        <div className="relative pl-6">
            {/* Continuous vertical line - positioned behind everything */}
            {logs.length > 1 && (
                <div 
                    className="absolute left-[5px] w-[2px] bg-gray-200 dark:bg-gray-700"
                    style={{
                        top: DOT_TOP_OFFSET + DOT_SIZE / 2, // Start at center of first dot
                        bottom: DOT_TOP_OFFSET + DOT_SIZE / 2, // End at center of last dot
                    }}
                />
            )}

            {logs.map((log, index) => {
                const formattedDate = parseDateOnly(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const isFirst = index === 0;
                const hasInterval = index < intervals.length;
                const isToday = diffDaysDateOnly(getTodayDateString(), log.date) === 0;

                return (
                    <div key={log.id}>
                        {/* Entry Row */}
                        <div className="relative flex items-start">
                            {/* Dot - positioned in the padding area to align with the line */}
                            <div 
                                className={`absolute w-3 h-3 rounded-full z-10
                                    ${isFirst ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-400 dark:bg-gray-600'}`}
                                style={{ top: DOT_TOP_OFFSET, left: -24 }}
                            />

                            {/* Content */}
                            <div 
                                className="flex justify-between items-start flex-1 min-w-0 cursor-pointer"
                                onClick={() => onLogClick?.(log)}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-base leading-5">
                                        {isFirst && isToday ? 'Today' : formattedDate}
                                    </p>
                                    {isFirst && isToday && (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                            {formattedDate}
                                        </p>
                                    )}
                                    {log.note && (
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 italic">
                                            {log.note}
                                        </p>
                                    )}
                                </div>
                                <button 
                                    onClick={(e) => handleDelete(e, log.id)} 
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0 -mt-1"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Interval Section - spacer with centered pill */}
                        {hasInterval && (
                            <div 
                                className="relative"
                                style={{ height: INTERVAL_HEIGHT }}
                            >
                                {/* Interval pill - centered on the line (at -18px to center on the 6px line position) */}
                                <div 
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                                        flex items-center justify-center
                                        h-[22px] px-2 rounded-full whitespace-nowrap
                                        bg-gray-100 dark:bg-gray-800
                                        border border-gray-300 dark:border-gray-600
                                        text-gray-600 dark:text-gray-400
                                        text-[11px] font-semibold
                                        cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700
                                        transition-colors"
                                    style={{ left: -18 }}
                                    title={`Interval: ${intervals[index].interval}\nFrom ${intervals[index].fromDateFormatted} to ${intervals[index].toDateFormatted}`}
                                >
                                    {intervals[index].interval}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
