'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCategories, useItems } from '@/hooks/useData';
import { CategoryPicker } from '@/components/CategoryPicker';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import { recentCategoriesRepo } from '@/lib/storage/recentCategories';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

export default function EditItemPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { categories, reload: reloadCategories } = useCategories();
    const { items } = useItems();

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    useEffect(() => {
        if (items.length > 0 && id) {
            const item = items.find(i => i.id === id);
            if (item) {
                setTitle(item.title);
                setCategoryId(item.categoryId);
            }
            setLoading(false);
        }
    }, [items, id]);

    // Category Chips logic
    const recentIds = useMemo(() => recentCategoriesRepo.getRecentIds(), []);
    const displayCategories = useMemo(() => {
        const recent = categories.filter(c => recentIds.includes(c.id))
            .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
        const others = categories.filter(c => !recentIds.includes(c.id))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        return [...recent, ...others].slice(0, 8);
    }, [categories, recentIds]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim() || !categoryId) return;

        setIsSubmitting(true);
        try {
            await itemsRepo.update(id, {
                title: title.trim(),
                categoryId,
            });
            if (categoryId) {
                recentCategoriesRepo.trackUsage(categoryId);
            }
            router.back();
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black text-gray-400">
            <div className="animate-pulse">Loading...</div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Item</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !title.trim() || !categoryId}
                    className="text-primary font-semibold disabled:opacity-50 text-blue-600 dark:text-blue-400"
                >
                    Save
                </button>
            </header>

            <div className="flex-1 p-5 pb-24 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Item Name
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Category (optional)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {displayCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}
                                    className={clsx(
                                        "w-full h-11 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center border",
                                        categoryId === cat.id
                                            ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm"
                                            : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                    )}
                                >
                                    <span className="truncate">{cat.name}</span>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setIsPickerOpen(true)}
                                className="w-full h-11 px-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center border bg-gray-50 text-gray-500 border-dashed border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                More...
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <CategoryPicker
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                onCategoryCreated={async (newId) => {
                    await reloadCategories();
                    setCategoryId(newId);
                }}
            />
        </div>
    );
}
