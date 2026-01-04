import { getDB } from './db';
import { Item } from '../types';

export const itemsRepo = {
    async getAll(): Promise<Item[]> {
        const db = await getDB();
        const items = await db.getAll('items');
        // Sort by createdAt desc by default or whatever logic?
        // User asked for "Items sorted by most recently done" in UI. 
        // Repo should just return raw data or basic sort. We'll return raw for now.
        return items;
    },

    async create(item: Omit<Item, 'id' | 'createdAt'>): Promise<Item> {
        const db = await getDB();
        const newItem: Item = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        };
        await db.add('items', newItem);
        return newItem;
    },

    async update(id: string, updates: Partial<Item>): Promise<void> {
        const db = await getDB();
        const tx = db.transaction('items', 'readwrite');
        const store = tx.objectStore('items');
        const item = await store.get(id);
        if (item) {
            await store.put({ ...item, ...updates });
        }
        await tx.done;
    },

    async delete(id: string): Promise<void> {
        const db = await getDB();
        const tx = db.transaction(['items', 'logs'], 'readwrite');

        // Cascade delete logs
        const logStore = tx.objectStore('logs');
        const index = logStore.index('by-item');
        let cursor = await index.openCursor(IDBKeyRange.only(id));
        while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
        }

        // Delete item
        await tx.objectStore('items').delete(id);
        await tx.done;
    }
};
