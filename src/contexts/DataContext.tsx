'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useItems, useCategories } from '@/hooks/useData';
import { Item, Category, LogEntry } from '@/lib/types';
import { logsRepo } from '@/lib/storage/logsRepo';

interface DataContextValue {
    items: Item[];
    categories: Category[];
    itemsLoading: boolean;
    categoriesLoading: boolean;
    logsLoading: boolean;
    allLogs: Record<string, LogEntry[]>;
    getLogsForItem: (itemId: string) => LogEntry[];
    reloadItems: () => void;
    reloadCategories: () => void;
    reloadLogs: () => void;
    reloadLogsForItem: (itemId: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { items, loading: itemsLoading, reload: reloadItems } = useItems();
    const { categories, loading: categoriesLoading, reload: reloadCategories } = useCategories();

    // Global logs cache - keyed by itemId
    const [allLogs, setAllLogs] = useState<Record<string, LogEntry[]>>({});
    const [logsLoading, setLogsLoading] = useState(true);

    // Fetch all logs when items change
    useEffect(() => {
        async function fetchAllLogs() {
            if (items.length === 0) {
                setAllLogs({});
                setLogsLoading(false);
                return;
            }

            setLogsLoading(true);
            const logsMap: Record<string, LogEntry[]> = {};

            await Promise.all(items.map(async (item) => {
                const logs = await logsRepo.listByItem(item.id);
                logsMap[item.id] = logs;
            }));

            setAllLogs(logsMap);
            setLogsLoading(false);
        }

        fetchAllLogs();
    }, [items]);

    // Helper to get logs for a specific item (instant lookup)
    const getLogsForItem = useCallback((itemId: string): LogEntry[] => {
        return allLogs[itemId] || [];
    }, [allLogs]);

    // Reload all logs
    const reloadLogs = useCallback(async () => {
        if (items.length === 0) return;

        const logsMap: Record<string, LogEntry[]> = {};
        await Promise.all(items.map(async (item) => {
            const logs = await logsRepo.listByItem(item.id);
            logsMap[item.id] = logs;
        }));
        setAllLogs(logsMap);
    }, [items]);

    // Reload logs for a specific item (more efficient than reloading all)
    const reloadLogsForItem = useCallback(async (itemId: string) => {
        const logs = await logsRepo.listByItem(itemId);
        setAllLogs(prev => ({ ...prev, [itemId]: logs }));
    }, []);

    return (
        <DataContext.Provider
            value={{
                items,
                categories,
                itemsLoading,
                categoriesLoading,
                logsLoading,
                allLogs,
                getLogsForItem,
                reloadItems,
                reloadCategories,
                reloadLogs,
                reloadLogsForItem,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export function useDataContext() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useDataContext must be used within a DataProvider');
    }
    return context;
}


