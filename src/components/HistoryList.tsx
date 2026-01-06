import { LogEntry } from '@/lib/types';
import { diffDaysDateOnly, formatInterval, parseDateOnly, getTodayDateString } from '@/lib/dateUtils';
import { logsRepo } from '@/lib/storage/logsRepo';

interface HistoryListProps {
    logs: LogEntry[];
    onLogUpdate: () => void;
    onLogClick?: (log: LogEntry) => void;
}

export function HistoryList({ logs, onLogUpdate, onLogClick }: HistoryListProps) {
    const today = getTodayDateString();

    return (
        <div className="relative">
            {logs.map((log, index) => {
                const formattedDate = parseDateOnly(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const isFirst = index === 0;
                const isLast = index === logs.length - 1;
                
                // Calculate gap/ago
                let timeLabel = '';
                if (isFirst) {
                    const daysAgo = diffDaysDateOnly(today, log.date);
                    timeLabel = `${daysAgo}d ago`;
                } else {
                    const prevLog = logs[index - 1];
                    const gap = diffDaysDateOnly(prevLog.date, log.date);
                    timeLabel = `${gap}d gap`;
                }

                return (
                    <div key={log.id} className="relative pl-10 pb-7">
                        {/* Connecting Line */}
                        {!isLast && (
                            <div className="absolute left-[11px] top-[28px] bottom-0 w-[2px] bg-border-color dark:bg-border-color" />
                        )}

                        {/* Timeline Dot */}
                        <div 
                            className="absolute left-0 top-2 w-6 h-6 rounded-full bg-primary-blue border-4 border-white dark:border-black shadow-dot dark:shadow-dot z-10"
                        />

                        {/* Entry Card */}
                        <div 
                            className="p-4 rounded-xl bg-[#fafafa] dark:bg-[#1c1c1e] border-none dark:border dark:border-border-color cursor-pointer active:scale-98 active:dark:bg-[#252527] transition-all"
                            onClick={() => onLogClick?.(log)}
                        >
                            <p className="text-[17px] font-semibold text-text-primary dark:text-white mb-1.5">
                                {formattedDate}
                            </p>
                            
                            {log.note && (
                                <p className="text-sm text-text-secondary dark:text-text-secondary italic mb-2">
                                    {log.note}
                                </p>
                            )}

                            <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold text-primary-blue bg-white dark:bg-bg-blue-tint">
                                {timeLabel}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
