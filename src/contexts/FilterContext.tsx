'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface FilterContextType {
  isFilterSheetOpen: boolean;
  isSortSheetOpen: boolean;
  isSettingsSheetOpen: boolean;
  openFilterSheet: () => void;
  openSortSheet: () => void;
  openSettingsSheet: () => void;
  closeFilterSheet: () => void;
  closeSortSheet: () => void;
  closeSettingsSheet: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);

  return (
    <FilterContext.Provider
      value={{
        isFilterSheetOpen,
        isSortSheetOpen,
        isSettingsSheetOpen,
        openFilterSheet: () => {
          setIsSortSheetOpen(false);
          setIsSettingsSheetOpen(false);
          setIsFilterSheetOpen(true);
        },
        openSortSheet: () => {
          setIsFilterSheetOpen(false);
          setIsSettingsSheetOpen(false);
          setIsSortSheetOpen(true);
        },
        openSettingsSheet: () => {
          setIsFilterSheetOpen(false);
          setIsSortSheetOpen(false);
          setIsSettingsSheetOpen(true);
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

