'use client';

import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterClick: () => void;
  filterActiveCount: number;
  onSortClick: () => void;
  sortActive: boolean;
  sortButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

export function SearchHeader({
  searchQuery,
  onSearchChange,
  onFilterClick,
  filterActiveCount,
  onSortClick,
  sortActive,
  sortButtonRef,
}: SearchHeaderProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local query with prop when it changes externally
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    onSearchChange(value);
  };

  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
    inputRef.current?.focus();
  };

  const hasSearchText = localQuery.length > 0;

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={20}
            />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={handleInputChange}
              placeholder="Search"
              className="w-full h-11 pl-10 pr-10 rounded-2xl border-none bg-[#f5f7fa] dark:bg-[#2a3142] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none transition-all duration-200 focus:-translate-y-0.5 focus:shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)]"
            />
            {hasSearchText && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={onFilterClick}
          className="relative h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Filter"
        >
          <SlidersHorizontal size={20} />
          {filterActiveCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {filterActiveCount}
            </span>
          )}
        </button>

        {/* Sort Button */}
        <button
          ref={sortButtonRef}
          id="sort-button"
          onClick={onSortClick}
          className="relative h-11 w-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Sort"
          aria-haspopup="menu"
        >
          <ArrowUpDown size={20} />
          {sortActive && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-600"></span>
          )}
        </button>
      </div>
    </div>
  );
}

