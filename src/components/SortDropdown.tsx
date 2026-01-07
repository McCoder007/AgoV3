'use client';

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export type SortMethod = 'recently-done' | 'alphabetical' | 'oldest-first' | 'never-done';

interface SortDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  sortMethod: SortMethod;
  onSortChange: (method: SortMethod) => void;
  sortButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const SORT_OPTIONS: { value: SortMethod; label: string }[] = [
  { value: 'recently-done', label: 'Most Recent' },
  { value: 'oldest-first', label: 'Least Recent' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'never-done', label: 'Never Done' },
];

export function SortDropdown({
  isOpen,
  onClose,
  sortMethod,
  onSortChange,
  sortButtonRef,
}: SortDropdownProps) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Set shouldRender immediately when isOpen changes (no delay)
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Use requestAnimationFrame to ensure element is rendered in hidden state first
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsEntering(true);
        });
      });
    } else if (shouldRender) {
      // Start exit animation
      setIsEntering(false);
      setIsAnimating(true);
      setTimeout(() => {
        setShouldRender(false);
        setIsAnimating(false);
        setPosition(null);
        setFocusedIndex(null);
      }, 150);
    }
  }, [isOpen, shouldRender]);

  // Calculate position synchronously before paint (useLayoutEffect)
  useLayoutEffect(() => {
    if (isOpen && sortButtonRef.current) {
      const buttonRect = sortButtonRef.current.getBoundingClientRect();
      const right = window.innerWidth - buttonRect.right;
      const top = buttonRect.bottom + 8;

      // Handle responsive positioning - shift left if dropdown would go off screen
      let adjustedRight = right;
      const dropdownWidth = 280;
      const minMargin = 16;
      
      if (right + dropdownWidth > window.innerWidth - minMargin) {
        adjustedRight = Math.max(minMargin, window.innerWidth - buttonRect.right - dropdownWidth);
      }

      setPosition({ top, right: adjustedRight });
    }
  }, [isOpen, sortButtonRef]);

  // Recalculate position on window resize/scroll
  useEffect(() => {
    if (!isOpen || !position) return;

    const updatePosition = () => {
      if (sortButtonRef.current) {
        const buttonRect = sortButtonRef.current.getBoundingClientRect();
        const right = window.innerWidth - buttonRect.right;
        const top = buttonRect.bottom + 8;

        let adjustedRight = right;
        const dropdownWidth = 280;
        const minMargin = 16;
        
        if (right + dropdownWidth > window.innerWidth - minMargin) {
          adjustedRight = Math.max(minMargin, window.innerWidth - buttonRect.right - dropdownWidth);
        }

        setPosition({ top, right: adjustedRight });
      }
    };

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, position, sortButtonRef]);

  // Haptic feedback helper
  const triggerHaptic = useCallback((type: 'light' | 'medium' = 'light') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'light' ? 10 : 20);
    }
  }, []);

  const handleSortSelect = useCallback((method: SortMethod) => {
    if (method !== sortMethod) {
      triggerHaptic('medium');
      onSortChange(method);
    } else {
      triggerHaptic('light');
    }
    
    // Close after 150ms delay to show selection
    setTimeout(() => {
      onClose();
    }, 150);
  }, [sortMethod, onSortChange, onClose, triggerHaptic]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || !shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = focusedIndex ?? (sortMethod === 'recently-done' ? 0 : 
          sortMethod === 'oldest-first' ? 1 :
          sortMethod === 'alphabetical' ? 2 : 3);
        
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length
          : (currentIndex + 1) % SORT_OPTIONS.length;
        
        setFocusedIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (focusedIndex !== null) {
          handleSortSelect(SORT_OPTIONS[focusedIndex].value);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shouldRender, focusedIndex, sortMethod, handleSortSelect, onClose]);

  // Focus first option when opening
  useEffect(() => {
    if (isOpen && shouldRender) {
      // Small delay to ensure dropdown is rendered
      const timer = setTimeout(() => {
        const currentIndex = SORT_OPTIONS.findIndex(opt => opt.value === sortMethod);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
        optionRefs.current[currentIndex >= 0 ? currentIndex : 0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender, sortMethod]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!shouldRender) return null;

  const dropdownContent = (
    <>
      {/* Overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-[999] transition-opacity backdrop-blur-[4px]',
          'bg-black/20 dark:bg-black/40',
          isEntering && !isAnimating
            ? 'opacity-100'
            : 'opacity-0'
        )}
        style={{
          transitionDuration: isEntering && !isAnimating ? '0.2s' : '0.15s',
          transitionTimingFunction: isEntering && !isAnimating ? 'ease-out' : 'ease-in',
        }}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={clsx(
          'fixed z-[1000] transition-all',
          isEntering && !isAnimating
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-[8px]'
        )}
        style={{
          top: position?.top ?? 0,
          right: position?.right ?? 0,
          width: '280px',
          transitionDuration: isEntering && !isAnimating ? '0.2s' : '0.15s',
          transitionTimingFunction: isEntering && !isAnimating ? 'ease-out' : 'ease-in',
        }}
        role="menu"
        aria-labelledby="sort-button"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-[20px] bg-white dark:bg-[#1e2530] shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
        >
          {/* Header */}
          <div
            className="border-b border-black/8 dark:border-white/10"
            style={{
              padding: '16px 20px 12px 20px',
            }}
          >
            <h3
              className="text-[#000000] dark:text-white m-0"
              style={{
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: '-0.01em',
              }}
            >
              Sort By
            </h3>
          </div>

          {/* Content */}
          <div style={{ padding: '6px 0' }}>
            {SORT_OPTIONS.map((option, index) => {
              const isSelected = sortMethod === option.value;
              return (
                <button
                  key={option.value}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  onClick={() => handleSortSelect(option.value)}
                  onMouseDown={() => {
                    triggerHaptic('light');
                  }}
                  onTouchStart={() => {
                    triggerHaptic('light');
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between border-none cursor-pointer',
                    'bg-transparent outline-none',
                    'transition-colors duration-150',
                    'hover:bg-black/5 dark:hover:bg-white/5',
                    'focus:outline-none focus:ring-0 focus:border-0'
                  )}
                  style={{
                    padding: '16px 20px',
                    outline: 'none',
                    border: 'none',
                    boxShadow: 'none',
                  }}
                  role="menuitem"
                  aria-checked={isSelected}
                  tabIndex={focusedIndex === index ? 0 : -1}
                >
                  <span
                    className={clsx(
                      'transition-opacity duration-150',
                      isSelected
                        ? 'text-[#1a1f2e] dark:text-white'
                        : 'text-[#1a1f2e] dark:text-white/90'
                    )}
                    style={{
                      fontSize: '17px',
                      fontWeight: 500,
                    }}
                  >
                    {option.label}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0A84FF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-opacity duration-150 flex-shrink-0"
                    style={{
                      opacity: isSelected ? 1 : 0,
                    }}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  // Render via portal to document body
  if (typeof window === 'undefined') return null;
  return createPortal(dropdownContent, document.body);
}

