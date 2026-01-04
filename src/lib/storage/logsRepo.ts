import { getDB } from './db';
import { LogEntry } from '../types';

export const logsRepo = {
    async listByItem(itemId: string): Promise<LogEntry[]> {
        const db = await getDB();
        // Return sorted by date desc
        const logs = await db.getAllFromIndex('logs', 'by-item', itemId);
        return logs.sort((a, b) => b.date.localeCompare(a.date));
    },

    async add(itemId: string, date: string, note?: string): Promise<LogEntry> {
        const db = await getDB();
        const newLog: LogEntry = {
            id: crypto.randomUUID(),
            itemId,
            date,
            note,
            createdAt: new Date().toISOString(),
        };
        await db.add('logs', newLog);
        return newLog;
    },

    async update(id: string, updates: Partial<LogEntry>): Promise<void> {
        const db = await getDB();
        const tx = db.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');
        const log = await store.get(id);
        if (log) {
            await store.put({ ...log, ...updates });
        }
        await tx.done;
    },

    async delete(id: string): Promise<void> {
        const db = await getDB();
        await db.delete('logs', id);
    },

    // Helper to get the most recent log for an item
    async getLastLog(itemId: string): Promise<LogEntry | undefined> {
        const logs = await this.listByItem(itemId);
        return logs[0];
    }
};
