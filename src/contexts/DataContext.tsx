'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useItems, useCategories } from '@/hooks/useData';
import { Item, Category } from '@/lib/types';

interface DataContextValue {
    items: Item[];
    categories: Category[];
    itemsLoading: boolean;
    categoriesLoading: boolean;
    reloadItems: () => void;
    reloadCategories: () => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const { items, loading: itemsLoading, reload: reloadItems } = useItems();
    const { categories, loading: categoriesLoading, reload: reloadCategories } = useCategories();

    return (
        <DataContext.Provider
            value={{
                items,
                categories,
                itemsLoading,
                categoriesLoading,
                reloadItems,
                reloadCategories,
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


