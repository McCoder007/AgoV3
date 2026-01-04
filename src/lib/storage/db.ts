import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Category, Item, LogEntry, UserPreferences, DEFAULT_CATEGORIES, DEFAULT_PREFERENCES, DEFAULT_CATEGORY_COLORS } from '../types';

interface AgoDB extends DBSchema {
    categories: {
        key: string;
        value: Category;
        indexes: { 'by-sort': number };
    };
    items: {
        key: string;
        value: Item;
        indexes: { 'by-category': string };
    };
    logs: {
        key: string;
        value: LogEntry;
        indexes: { 'by-item': string; 'by-date': string; 'by-created': string };
    };
    prefs: {
        key: string;
        value: UserPreferences;
    };
}

const DB_NAME = 'ago-db';
const DB_VERSION = 6;

let dbPromise: Promise<IDBPDatabase<AgoDB>>;

export function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<AgoDB>(DB_NAME, DB_VERSION, {
            async upgrade(db, oldVersion, newVersion, transaction) {
                // Helper to check if store exists
                const hasStore = (name: string) => {
                    try {
                        return Array.from(db.objectStoreNames).includes(name);
                    } catch {
                        return false;
                    }
                };
                
                // Helper to ensure index exists on existing store
                // Use the transaction parameter which is the versionchange transaction
                const ensureIndex = (storeName: string, indexName: string, keyPath: string) => {
                    if (!transaction) {
                        console.warn('No transaction available for index creation');
                        return;
                    }
                    try {
                        const store = transaction.objectStore(storeName);
                        if (store && !store.indexNames.contains(indexName)) {
                            store.createIndex(indexName, keyPath);
                        }
                    } catch (e: any) {
                        // Index might already exist or store doesn't exist - that's okay
                        if (e?.name !== 'ConstraintError' && e?.name !== 'InvalidStateError' && e?.name !== 'NotFoundError') {
                            console.warn(`Could not ensure index ${indexName} on ${storeName}:`, e);
                        }
                    }
                };
                
                // Categories
                if (!hasStore('categories')) {
                    const catStore = db.createObjectStore('categories', { keyPath: 'id' });
                    catStore.createIndex('by-sort', 'sortOrder');
                } else {
                    // Always ensure index exists (fixes databases where index creation failed)
                    ensureIndex('categories', 'by-sort', 'sortOrder');
                }

                // Items
                if (!hasStore('items')) {
                    const itemStore = db.createObjectStore('items', { keyPath: 'id' });
                    itemStore.createIndex('by-category', 'categoryId');
                } else {
                    ensureIndex('items', 'by-category', 'categoryId');
                }

                // Logs
                if (!hasStore('logs')) {
                    const logStore = db.createObjectStore('logs', { keyPath: 'id' });
                    logStore.createIndex('by-item', 'itemId');
                    logStore.createIndex('by-date', 'date');
                    logStore.createIndex('by-created', 'createdAt');
                } else {
                    ensureIndex('logs', 'by-item', 'itemId');
                    ensureIndex('logs', 'by-date', 'date');
                    ensureIndex('logs', 'by-created', 'createdAt');
                }

                // Prefs
                if (!hasStore('prefs')) {
                    // key will be 'settings'
                    db.createObjectStore('prefs');
                }

                // Migration: Add default colors to existing categories
                if (oldVersion < 6 && hasStore('categories')) {
                    const catStore = transaction.objectStore('categories');
                    const categories = await catStore.getAll();
                    
                    for (const category of categories) {
                        // Only add color if it doesn't exist
                        if (!category.color) {
                            // Find matching default category or use gray
                            const defaultIndex = DEFAULT_CATEGORIES.indexOf(category.name);
                            const defaultColor = defaultIndex >= 0 && defaultIndex < DEFAULT_CATEGORY_COLORS.length
                                ? DEFAULT_CATEGORY_COLORS[defaultIndex]
                                : '#6B7280'; // Gray fallback
                            
                            category.color = defaultColor;
                            await catStore.put(category);
                        }
                    }
                }
            },
            blocked() {
                console.warn('Database upgrade blocked');
            },
            blocking() {
                console.warn('Database upgrade blocking');
            },
        }).catch((error) => {
            console.error('Failed to open database:', error);
            // Reset the promise so we can try again
            dbPromise = undefined as any;
            throw error;
        });
    }
    return dbPromise;
}

/**
 * Seed default categories if empty
 */
export async function seedDefaults() {
    const db = await getDB();
    const tx = db.transaction(['categories', 'prefs'], 'readwrite');

    // Seed Categories
    const catStore = tx.objectStore('categories');
    const count = await catStore.count();

    if (count === 0) {
        const now = new Date().toISOString();
        for (const [index, name] of DEFAULT_CATEGORIES.entries()) {
            await catStore.add({
                id: crypto.randomUUID(),
                name,
                sortOrder: index,
                createdAt: now,
                color: DEFAULT_CATEGORY_COLORS[index] || '#6B7280',
            });
        }
    }

    // Seed Prefs
    const prefsStore = tx.objectStore('prefs');
    const existingPrefs = await prefsStore.get('settings');
    if (!existingPrefs) {
        await prefsStore.put(DEFAULT_PREFERENCES, 'settings');
    }

    await tx.done;
}

/**
 * Clear entire database - useful for resetting the app
 */
export async function clearDatabase(): Promise<void> {
    // Delete the database entirely
    const db = await getDB();
    db.close();
    
    // Reset the promise so it can be reopened
    dbPromise = undefined as any;
    
    // Delete the database
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
            console.warn('Database deletion blocked - close other tabs');
            resolve(); // Still resolve, the page will reload anyway
        };
    });
}
