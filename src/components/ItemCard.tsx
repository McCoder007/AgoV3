'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Item } from '@/lib/types';
import { useLastLog } from '@/hooks/useData';
import { useDataContext } from '@/contexts/DataContext';
import { diffDaysDateOnly, getTodayDateString, formatDisplayDate } from '@/lib/dateUtils';
import { getSwipeGradient } from '@/lib/colorUtils';
import { CategoryPill } from '@/components/CategoryPill';
import { Check, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { logsRepo } from '@/lib/storage/logsRepo';

interface ItemCardProps {
    item: Item;
    onDone?: (actionType?: 'complete' | 'undo') => void;
    density: 'regular' | 'compact';
    isHighlighted?: boolean;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
}

// Trivial change to trigger HMR rebuild
export function ItemCard({ item, onDone, density, isHighlighted }: ItemCardProps) {
    const { lastLog, loading, reload } = useLastLog(item.id);
    const { categories } = useDataContext();
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Swipe State
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [offsetX, setOffsetX] = useState(0);
    const [isStampActive, setIsStampActive] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [particlesActive, setParticlesActive] = useState(false);
    const [showHighlight, setShowHighlight] = useState(false);

    const dragInfo = useRef({
        startX: 0,
        startY: 0,
        startTime: 0,
        currentX: 0,
        hasCommittedToSwipe: false, // True once we've determined this is an intentional swipe
    });

    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Handle highlight and scroll
    useEffect(() => {
        if (isHighlighted && containerRef.current) {
            // Small delay to ensure the list has finished re-sorting
            const timer = setTimeout(() => {
                containerRef.current?.scrollIntoView({
                    behavior: 'instant',
                    block: 'center'
                });
                setShowHighlight(true);
                // Highlight stays for the duration set in parent (2.5s)
                // but we can turn off the animation state locally earlier if needed
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setShowHighlight(false);
        }
    }, [isHighlighted]);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    const category = categories.find(c => c.id === item.categoryId);
    const categoryName = category?.name || 'Uncategorized';
    const swipeGradient = getSwipeGradient(category?.color);

    const triggerCompletion = useCallback(async () => {
        if (isCompleting) return;
        setIsCompleting(true);

        // Haptic Feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        // Spring Stamp
        setIsStampActive(true);
        setTimeout(() => setIsStampActive(false), 300);

        // Confetti Pop
        const color = category?.color || '#3B82F6';
        const newParticles: Particle[] = Array.from({ length: 8 }).map((_, i) => ({
            id: Date.now() + i,
            x: 0,
            y: 0,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            color
        }));
        setParticles(newParticles);
        setParticlesActive(false);

        // Use requestAnimationFrame to ensure the initial state (at 0,0) is rendered before triggering animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setParticlesActive(true);
            });
        });

        setTimeout(() => {
            setParticles([]);
            setParticlesActive(false);
        }, 800);

        // Animation Sequence
        // 1. Slide card off (handled by CSS transition on isCompleting)
        // 2. Wait for slide to finish, then collapse
        setTimeout(() => {
            setIsCollapsed(true);
            // 3. Trigger actual logic after collapse
            setTimeout(async () => {
                await logsRepo.add(item.id, getTodayDateString());
                reload();
                onDone?.('complete');
            }, 300);
        }, 300);
    }, [isCompleting, item.id, reload, onDone, category?.color]);

    const triggerUndo = useCallback(async () => {
        if (!lastLog || isCompleting) return;
        setIsCompleting(true);

        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        setIsStampActive(true);
        setTimeout(() => setIsStampActive(false), 300);

        // Animation sequence for undo
        setTimeout(() => {
            setIsCollapsed(true);
            setTimeout(async () => {
                await logsRepo.delete(lastLog.id);
                reload();
                onDone?.('undo');
                // After reload, we need to make sure the card is visible again if it's still in the list
                // But usually the parent will re-render the list. 
                // For safety, we reset states if the component doesn't unmount
                setIsCollapsed(false);
                setIsCompleting(false);
                setOffsetX(0);
            }, 300);
        }, 300);
    }, [isCompleting, lastLog, reload, onDone]);

    const handleDragStart = (clientX: number, clientY: number) => {
        if (isCompleting) return;
        // Allow swipe left only if isToday is true
        // Allow swipe right only if isToday is false
        dragInfo.current = {
            startX: clientX,
            startY: clientY,
            startTime: Date.now(),
            currentX: clientX,
            hasCommittedToSwipe: false,
        };
        setIsDragging(true);
    };

    const handleDragMove = (clientX: number, clientY: number) => {
        if (!isDragging || isCompleting) return;

        const diffX = clientX - dragInfo.current.startX;
        const diffY = clientY - dragInfo.current.startY;

        // If we haven't committed to swiping yet, check if this is an intentional swipe
        if (!dragInfo.current.hasCommittedToSwipe) {
            const absDiffX = Math.abs(diffX);
            const absDiffY = Math.abs(diffY);

            // Require horizontal movement to exceed 12px AND be at least 1.5x the vertical movement
            // This ensures scrolling doesn't accidentally trigger swipe
            if (absDiffX >= 12 && absDiffX > absDiffY * 1.5) {
                dragInfo.current.hasCommittedToSwipe = true;
            } else if (absDiffY > 10) {
                // If vertical movement is significant first, this is likely a scroll - cancel
                setIsDragging(false);
                setOffsetX(0);
                return;
            } else {
                // Not enough movement yet to determine intent
                return;
            }
        }

        if (isToday) {
            // Undo mode: only allow swipe left (diffX < 0)
            setOffsetX(Math.min(0, diffX));
        } else {
            // Complete mode: only allow swipe right (diffX > 0)
            setOffsetX(Math.max(0, diffX));
        }

        dragInfo.current.currentX = clientX;
    };

    const handleDragEnd = () => {
        if (!isDragging || isCompleting) return;

        const diff = dragInfo.current.currentX - dragInfo.current.startX;
        const duration = Date.now() - dragInfo.current.startTime;
        const velocity = Math.abs(diff) / duration; // px/ms

        const thresholdMet = Math.abs(diff) > 120 || (velocity > 0.5 && Math.abs(diff) > 30);

        if (thresholdMet) {
            if (isToday && diff < 0) {
                triggerUndo();
            } else if (!isToday && diff > 0) {
                triggerCompletion();
            } else {
                setOffsetX(0);
            }
        } else {
            setOffsetX(0);
        }

        setIsDragging(false);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX, e.clientY);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const handleMouseUp = () => handleDragEnd();
        const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        const handleTouchEnd = () => handleDragEnd();

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging]);

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Only navigate if we didn't just perform a drag action
        const dragDist = Math.abs(dragInfo.current.currentX - dragInfo.current.startX);
        if (dragDist >= 5 || isDragging || isCompleting) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    let daysSince: number | 'Never' = 'Never';
    let isToday = false;

    if (lastLog) {
        const diff = diffDaysDateOnly(getTodayDateString(), lastLog.date);
        daysSince = diff;
        isToday = diff === 0;
    }

    const isCompact = density === 'compact';

    return (
        <div
            ref={containerRef}
            className={`relative transition-all duration-300 ease-out overflow-hidden`}
            style={{
                height: isCollapsed ? 0 : 'auto',
                opacity: isCollapsed ? 0 : 1,
                marginBottom: isCollapsed ? 0 : (isCompact ? '12px' : '16px'),
            }}
        >
            {/* Swipe Background Layer */}
            <div
                className={`absolute inset-0 rounded-3xl transition-opacity duration-200 flex items-center overflow-hidden ${offsetX < 0 ? 'justify-end px-6' : 'px-6'}`}
                style={{
                    background: offsetX < 0
                        ? (isDarkMode 
                            ? 'linear-gradient(270deg, #DC2626, #7F1D1D)' 
                            : 'linear-gradient(270deg, #EF4444, #FEF2F2)')
                        : swipeGradient,
                    opacity: Math.abs(offsetX) > 30 || isCompleting ? 1 : 0,
                }}
            >
                <div className={`flex items-center gap-3 relative ${offsetX < 0 ? 'flex-row-reverse' : ''}`}>
                    <div
                        className={`flex items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ${isStampActive ? 'scale-[1.3]' : 'scale-100'}`}
                        style={{ width: 40, height: 40 }}
                    >
                        {offsetX < 0 ? <Undo2 size={24} className="text-white" /> : <Check size={24} className="text-white" />}
                    </div>
                    <span className="text-white font-bold text-lg uppercase tracking-wider">
                        {offsetX < 0 ? 'Undo' : 'Complete'}
                    </span>

                    {/* Particles (only for complete) */}
                    {offsetX >= 0 && particles.map(p => (
                        <div
                            key={p.id}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: 6,
                                height: 6,
                                backgroundColor: p.color,
                                left: 20,
                                top: 20,
                                transform: particlesActive ? `translate(${p.vx * 4}px, ${p.vy * 4}px)` : 'translate(0, 0)',
                                transition: 'transform 0.8s cubic-bezier(0, 0, 0.2, 1), opacity 0.8s',
                                opacity: particlesActive ? 0 : 1,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Task Card */}
            <Link
                href={`/items/${item.id}`}
                prefetch={true}
                className="block"
                onClick={handleLinkClick}
            >
                <div
                    ref={cardRef}
                    className={`group relative overflow-hidden rounded-3xl border ${isCompact ? 'px-3 py-3' : 'px-4 py-4'} cursor-grab active:cursor-grabbing`}
                    style={{
                        backgroundColor: (isDarkMode ? '#111827' : '#ffffff'),
                        borderColor: (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)'),
                        boxShadow: (isDarkMode ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'),
                        transform: isCompleting
                            ? (offsetX < 0 ? 'translate3d(-110%, 0, 0)' : 'translate3d(110%, 0, 0)')
                            : `translate3d(${offsetX + (isHighlighted && !showHighlight ? -20 : 0)}px, 0, 0)`,
                        transitionProperty: 'transform, opacity',
                        transitionDuration: isDragging ? '0ms' : '400ms',
                        transitionTimingFunction: (!isDragging && !isCompleting) ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: (isHighlighted && !showHighlight) ? 0 : (isToday ? 0.7 : 1),
                        zIndex: showHighlight ? 10 : 0,
                        touchAction: 'pan-y',
                        willChange: 'transform, opacity',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden'
                    }}
                    onMouseDown={onMouseDown}
                    onTouchStart={onTouchStart}
                >
                <div className="flex justify-between items-stretch gap-4 pointer-events-none">
                    {/* Left Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <h3 className={`font-bold text-gray-900 dark:text-gray-100 truncate leading-tight ${isCompact ? 'text-xl' : 'text-2xl'}`}>
                            {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                            <CategoryPill categoryName={categoryName} isDark={isDarkMode} />
                            {lastLog && (
                                <span className="text-[13px] font-medium text-gray-400 dark:text-gray-500">
                                    {formatDisplayDate(lastLog.date)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex items-center gap-4 shrink-0">
                        {/* Metric Group */}
                        <div className="flex flex-col items-end justify-between py-0.5">
                            {daysSince === 'Never' ? (
                                <div className="w-8 h-[2px] bg-gray-200 dark:bg-gray-700 rounded-full my-auto" />
                            ) : (
                                <>
                                    <span className="font-bold text-4xl text-gray-900 dark:text-white leading-none">
                                        {daysSince}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400/60 dark:text-gray-500/60 uppercase tracking-widest mt-1.5 leading-none">
                                        {daysSince === 1 ? 'DAY' : 'DAYS'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </Link>
        </div>
    );
}
