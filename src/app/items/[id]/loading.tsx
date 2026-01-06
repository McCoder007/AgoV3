'use client';

export default function ItemDetailLoading() {
    return (
        <div className="flex flex-col min-h-[100dvh] bg-white dark:bg-black font-sans animate-pulse">
            {/* Header Section */}
            <header className="flex flex-col">
                <div className="px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-5 border-b border-border-color dark:border-border-color">
                    {/* Back button placeholder */}
                    <div className="flex justify-between items-center mb-5">
                        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>

                    <div className="flex justify-between items-start">
                        {/* Title and category */}
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        </div>

                        {/* Days ago */}
                        <div className="text-right shrink-0">
                            <div className="h-14 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                            <div className="h-3 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mt-5 flex gap-3 p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-border-color dark:border-border-color">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex-1 text-center py-2">
                                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
                                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Action Button */}
                <section className="px-6 py-6">
                    <div className="w-[75%] mx-auto mb-6 py-[14px] h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </section>

                {/* History Section */}
                <section>
                    <div className="px-6 pt-6 pb-4">
                        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="px-6 pb-24 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
