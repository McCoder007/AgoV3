import { useState, useEffect, useCallback } from 'react';
import { Category, Item, LogEntry, UserPreferences, DEFAULT_PREFERENCES } from '../lib/types';
import { categoriesRepo } from '../lib/storage/categoriesRepo';
import { itemsRepo } from '../lib/storage/itemsRepo';
import { logsRepo } from '../lib/storage/logsRepo';
import { prefsRepo } from '../lib/storage/prefsRepo';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await categoriesRepo.list();
            setCategories(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { categories, loading, reload: load };
}

export function useItems() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await itemsRepo.getAll();
            setItems(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { items, loading, reload: load };
}

export function useItemLogs(itemId: string) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!itemId) return;
        setLoading(true);
        try {
            const data = await logsRepo.listByItem(itemId);
            setLogs(data);
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        load();
    }, [load]);

    return { logs, loading, reload: load };
}

export function useLastLog(itemId: string) {
    const [lastLog, setLastLog] = useState<LogEntry | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!itemId) return;
        setLoading(true);
        try {
            const data = await logsRepo.getLastLog(itemId);
            setLastLog(data);
        } finally {
            setLoading(false);
        }
    }, [itemId]);

    useEffect(() => {
        load();
    }, [load]);

    return { lastLog, loading, reload: load };
}

export function usePreferences() {
    const [prefs, setPrefs] = useState<UserPreferences>(() => {
        // Try to get initial theme from localStorage to prevent flash
        if (typeof window !== 'undefined') {
            try {
                const themeHint = localStorage.getItem('ago-theme') as ThemePreference | null;
                if (themeHint) {
                    return { ...DEFAULT_PREFERENCES, theme: themeHint };
                }
            } catch (e) {}
        }
        return DEFAULT_PREFERENCES;
    });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await prefsRepo.get();
            setPrefs(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const updatePrefs = useCallback(async (updates: Partial<UserPreferences>) => {
        await prefsRepo.set(updates);
        setPrefs(prev => ({ ...prev, ...updates }));
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return { prefs, updatePrefs, loading, reload: load };
}
