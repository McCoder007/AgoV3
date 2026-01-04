import { getDB } from './db';
import { UserPreferences, DEFAULT_PREFERENCES } from '../types';

export const prefsRepo = {
    async get(): Promise<UserPreferences> {
        const db = await getDB();
        const prefs = await db.get('prefs', 'settings');
        return prefs || DEFAULT_PREFERENCES;
    },

    async set(updates: Partial<UserPreferences>): Promise<void> {
        const db = await getDB();
        const tx = db.transaction('prefs', 'readwrite');
        const store = tx.objectStore('prefs');
        const current = (await store.get('settings')) || DEFAULT_PREFERENCES;
        const updated = { ...current, ...updates };

        await store.put(updated, 'settings');
        await tx.done;

        // Also update the theme hint in localStorage for the blocking script
        if (updates.theme && typeof window !== 'undefined') {
            try {
                localStorage.setItem('ago-theme', updates.theme);
            } catch (e) {}
        }
    }
};
