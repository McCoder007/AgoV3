'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useData';
import { CategoryDropdown } from '@/components/CategoryDropdown';
import { itemsRepo } from '@/lib/storage/itemsRepo';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

export default function AddItemPage() {
    const router = useRouter();
    const { categories, reload: reloadCategories } = useCategories();

    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCategoryCreated = async (newCategoryId: string) => {
        await reloadCategories();
        setCategoryId(newCategoryId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await itemsRepo.create({
                title: title.trim(),
                categoryId: categoryId || '', // Use empty string if no category selected
            });
            router.back();
        } catch (error) {
            console.error(error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-4 safe-top">
                <div className="flex items-center gap-2">
                    <Link href="/" className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <ChevronLeft />
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Item</h1>
                </div>
            </header>

            <div className="flex-1 px-5 py-6 pb-24 overflow-y-auto safe-bottom">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            What do you want to track?
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Water Plants, Oil Change..."
                            autoFocus
                            className="w-full px-4 py-3 text-lg rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Category
                        </label>
                        <CategoryDropdown
                            categories={categories}
                            selectedId={categoryId}
                            onSelect={setCategoryId}
                            onCreateCategory={handleCategoryCreated}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !title.trim()}
                            className={clsx(
                                "w-full px-6 py-4 text-lg font-semibold rounded-xl transition-all min-h-[52px]",
                                "bg-black dark:bg-white text-white dark:text-black",
                                "hover:opacity-90 active:scale-[0.98]",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                                "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
                            )}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
