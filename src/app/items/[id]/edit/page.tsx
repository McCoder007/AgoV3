'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCategories, useItems } from '@/hooks/useData';
import { CategoryPicker } from '@/components/CategoryPicker';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function EditItemPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { categories } = useCategories();
    const { items } = useItems();

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !categoryId) return;

        setIsSubmitting(true);
        try {
            await itemsRepo.update(id, {
                title: title.trim(),
                categoryId,
            });
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Category
                        </label>
                        <CategoryPicker
                            categories={categories}
                            selectedId={categoryId}
                            onSelect={setCategoryId}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
}
