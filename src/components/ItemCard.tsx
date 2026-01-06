'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Item } from '@/lib/types';
import { useLastLog, useCategories } from '@/hooks/useData';
import { diffDaysDateOnly, getTodayDateString, formatDisplayDate } from '@/lib/dateUtils';
import { getCategoryStyles } from '@/lib/colorUtils';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { logsRepo } from '@/lib/storage/logsRepo';

interface ItemCardProps {
    item: Item;
    onDone?: () => void;
    density: 'regular' | 'compact';
}

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
    'Personal': 'linear-gradient(90deg, #8B5CF6, #F3F0FF)',
    'Health': 'linear-gradient(90deg, #EF4444, #FEF2F2)',
    'Fitness': 'linear-gradient(90deg, #F59E0B, #FEF3C7)',
    'Car': 'linear-gradient(90deg, #3B82F6, #EFF6FF)',
    'Home': 'linear-gradient(90deg, #10B981, #ECFDF5)',
};

export function ItemCard({ item, onDone, density }: ItemCardProps) {
    const { lastLog, loading, reload } = useLastLog(item.id);
    const { categories } = useCategories();
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // Swipe State
    const [isDragging, setIsDragging] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [offsetX, setOffsetX] = useState(0);
    const [isStampActive, setIsStampActive] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [particlesActive, setParticlesActive] = useState(false);
    
    const dragInfo = useRef({
        startX: 0,
        startTime: 0,
        currentX: 0,
    });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

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
    const categoryStyles = category?.color ? getCategoryStyles(category.color, isDarkMode) : null;
    const swipeGradient = CATEGORY_GRADIENTS[categoryName] || 'linear-gradient(90deg, #6B7280, #F3F4F6)';

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
                onDone?.();
            }, 300);
        }, 300);
    }, [isCompleting, item.id, reload, onDone, category?.color]);

    const handleDragStart = (clientX: number) => {
        if (isCompleting || isToday) return;
        dragInfo.current = {
            startX: clientX,
            startTime: Date.now(),
            currentX: clientX,
        };
        setIsDragging(true);
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging || isCompleting) return;
        const diff = clientX - dragInfo.current.startX;
        if (diff < 0) {
            setOffsetX(0);
        } else {
            setOffsetX(diff);
        }
        dragInfo.current.currentX = clientX;
    };

    const handleDragEnd = () => {
        if (!isDragging || isCompleting) return;
        
        const diff = dragInfo.current.currentX - dragInfo.current.startX;
        const duration = Date.now() - dragInfo.current.startTime;
        const velocity = diff / duration; // px/ms

        const thresholdMet = diff > 120 || (velocity > 0.5 && diff > 30);

        if (thresholdMet) {
            triggerCompletion();
        } else {
            // Snap back
            setIsDragging(false);
            setOffsetX(0);
        }
        
        setIsDragging(false);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        handleDragStart(e.clientX);
    };

    const onTouchStart = (e: React.TouchEvent) => {
        handleDragStart(e.touches[0].clientX);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
        const handleMouseUp = () => handleDragEnd();
        const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX);
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

    const handleCardClick = (e: React.MouseEvent) => {
        // Only navigate if we didn't just perform a drag action
        const dragDist = Math.abs(dragInfo.current.currentX - dragInfo.current.startX);
        if (dragDist < 5) {
            router.push(`/items/${item.id}`);
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
                className={`absolute inset-0 rounded-3xl transition-opacity duration-200 flex items-center px-6 overflow-hidden`}
                style={{
                    background: swipeGradient,
                    opacity: offsetX > 30 || isCompleting ? 1 : 0,
                }}
            >
                <div className="flex items-center gap-3 relative">
                    <div 
                        className={`flex items-center justify-center rounded-full bg-white/20 transition-transform duration-300 ${isStampActive ? 'scale-[1.3]' : 'scale-100'}`}
                        style={{ width: 40, height: 40 }}
                    >
                        <Check size={24} className="text-white" />
                    </div>
                    <span className="text-white font-bold text-lg uppercase tracking-wider">Complete</span>
                    
                    {/* Particles */}
                    {particles.map(p => (
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
            <div
                ref={cardRef}
                onClick={handleCardClick}
                className={`block group relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900/50 border transition-all ${!isDragging ? 'duration-300' : ''} ${isCompact ? 'px-3 py-3' : 'px-4 py-4'} ${isToday ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                style={{
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)',
                    boxShadow: isDarkMode ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    transform: isCompleting ? 'translateX(110%)' : `translateX(${offsetX}px)`,
                    transitionTimingFunction: !isDragging && !isCompleting ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: isToday ? 0.7 : 1,
                    touchAction: 'pan-y'
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
                            <span 
                                className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                                style={categoryStyles ? { 
                                    color: categoryStyles.color,
                                    backgroundColor: categoryStyles.backgroundColor,
                                    border: isDarkMode ? `1px solid ${categoryStyles.color}20` : 'none'
                                } : {
                                    color: isDarkMode ? '#9CA3AF' : '#6B7280',
                                    backgroundColor: isDarkMode ? '#1F2937' : '#F3F4F6'
                                }}
                            >
                                {categoryName}
                            </span>
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
        </div>
    );
}
