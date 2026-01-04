'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  isFilterSheetOpen: boolean;
  isSortSheetOpen: boolean;
  isSettingsSheetOpen: boolean;
  isNewItemSheetOpen: boolean;
  openFilterSheet: () => void;
  openSortSheet: () => void;
  openSettingsSheet: () => void;
  openNewItemSheet: () => void;
  closeFilterSheet: () => void;
  closeSortSheet: () => void;
  closeSettingsSheet: () => void;
  closeNewItemSheet: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isNewItemSheetOpen, setIsNewItemSheetOpen] = useState(false);

  return (
    <FilterContext.Provider
      value={{
        isFilterSheetOpen,
        isSortSheetOpen,
        isSettingsSheetOpen,
        isNewItemSheetOpen,
        openFilterSheet: () => {
          setIsSortSheetOpen(false);
          setIsSettingsSheetOpen(false);
          setIsNewItemSheetOpen(false);
          setIsFilterSheetOpen(prev => !prev); // Toggle
        },
        openSortSheet: () => {
          setIsFilterSheetOpen(false);
          setIsSettingsSheetOpen(false);
          setIsNewItemSheetOpen(false);
          setIsSortSheetOpen(prev => !prev); // Toggle
        },
        openSettingsSheet: () => {
          setIsFilterSheetOpen(false);
          setIsSortSheetOpen(false);
          setIsNewItemSheetOpen(false);
          setIsSettingsSheetOpen(true);
        },
        openNewItemSheet: () => {
          setIsFilterSheetOpen(false);
          setIsSortSheetOpen(false);
          setIsSettingsSheetOpen(false);
          setIsNewItemSheetOpen(true);
        },
        closeFilterSheet: () => {
          setIsFilterSheetOpen(false);
        },
        closeSortSheet: () => {
          setIsSortSheetOpen(false);
        },
        closeSettingsSheet: () => {
          setIsSettingsSheetOpen(false);
        },
        closeNewItemSheet: () => {
          setIsNewItemSheetOpen(false);
        },
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}

