'use client';

import { useState, useEffect, useRef } from 'react';
import { LogEntry } from '@/lib/types';
import { parseDateOnly } from '@/lib/dateUtils';
import { X, Calendar } from 'lucide-react';
import { format, parse, isValid, isFuture } from 'date-fns';
import clsx from 'clsx';

interface EditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: LogEntry | null;
    onSave: (date: string, note?: string) => Promise<void>;
}

export function EditLogModal({ isOpen, onClose, log, onSave }: EditLogModalProps) {
    const [dateInput, setDateInput] = useState('');
    const [dateError, setDateError] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    const dateInputRef = useRef<HTMLInputElement>(null);
    const nativeDateRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && log) {
            setShouldRender(true);
            // Convert YYYY-MM-DD to MM/dd/yyyy
            try {
                const [y, m, d] = log.date.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                setDateInput(format(dateObj, 'MM/dd/yyyy'));
            } catch {
                setDateInput('');
            }
            setNote(log.note || '');
            setDateError('');
            const timer = setTimeout(() => {
                setIsAnimating(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsAnimating(false);
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, log]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!shouldRender || !log) return null;

    const validateDate = (val: string) => {
        if (!val) {
            setDateError('Date is required');
            return false;
        }
        
        // Try mm/dd/yyyy
        const parsed = parse(val, 'MM/dd/yyyy', new Date());
        if (!isValid(parsed)) {
            setDateError('Please use mm/dd/yyyy');
            return false;
        }
        
        if (isFuture(parsed)) {
            setDateError('Date cannot be in the future');
            return false;
        }
        
        setDateError('');
        return true;
    };

    const handleDateBlur = () => {
        validateDate(dateInput);
    };

    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // yyyy-mm-dd
        if (val) {
            const dateObj = new Date(val + 'T00:00:00');
            setDateInput(format(dateObj, 'MM/dd/yyyy'));
            setDateError('');
        }
    };

    const handleSave = async () => {
        if (!validateDate(dateInput)) return;

        setSaving(true);
        try {
            const parsed = parse(dateInput, 'MM/dd/yyyy', new Date());
            const dateStr = format(parsed, 'yyyy-MM-dd');
            await onSave(dateStr, note.trim() || undefined);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    // Format date for display
    const formatDateDisplay = (dateStr: string) => {
        try {
            const d = parseDateOnly(dateStr);
            return d.toLocaleDateString(undefined, { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-5"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 transition-opacity duration-300",
                    isAnimating ? "opacity-100" : "opacity-0"
                )}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                ref={modalRef}
                className={clsx(
                    "relative w-full max-w-[500px] bg-white dark:bg-[#1e2530] rounded-[24px] flex flex-col transition-all duration-300 ease-out max-h-[90vh] modal-shadow",
                    isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between px-8 pt-8 pb-0 shrink-0">
                    <h2 className="text-[28px] font-bold leading-tight text-[#1a1f2e] dark:text-white mb-8" style={{ letterSpacing: '-0.5px' }}>
                        Edit
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-[#f5f7fa] dark:bg-[#2a3142] text-[#6b7280] dark:text-[#9ca3af] flex items-center justify-center transition-all duration-200 hover:bg-[#e5e7eb] dark:hover:bg-[#3a4152] hover:rotate-90"
                        aria-label="Close"
                    >
                        <span className="text-2xl leading-none" style={{ fontSize: '24px' }}>✕</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div 
                    className="flex-1 overflow-y-auto px-8"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    <div className="pb-8">
                        {/* Date Field */}
                        <div className="mb-7">
                            <label htmlFor="edit-date" className="block text-[13px] font-semibold uppercase mb-3 text-[#6b7280] dark:text-[#9ca3af]" style={{ letterSpacing: '0.5px' }}>
                                DATE
                            </label>
                            <div className="relative">
                                <input
                                    ref={dateInputRef}
                                    type="text"
                                    id="edit-date"
                                    inputMode="numeric"
                                    value={dateInput}
                                    onChange={e => {
                                        setDateInput(e.target.value);
                                        if (dateError) setDateError('');
                                    }}
                                    onBlur={handleDateBlur}
                                    onClick={() => {
                                        try {
                                            (nativeDateRef.current as any)?.showPicker();
                                        } catch (e) {
                                            nativeDateRef.current?.focus();
                                        }
                                    }}
                                    placeholder="mm/dd/yyyy"
                                    className={clsx(
                                        "w-full pl-5 pr-12 py-4 text-base rounded-2xl border-none bg-[#f5f7fa] dark:bg-[#2a3142] text-[#1a1f2e] dark:text-white placeholder:opacity-50 placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] outline-none transition-all duration-200 focus:-translate-y-0.5",
                                        dateError 
                                            ? "focus:shadow-[0_4px_12px_rgba(239,68,68,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)]" 
                                            : "focus:shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)]"
                                    )}
                                    style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)' }}
                                />
                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            try {
                                                (nativeDateRef.current as any)?.showPicker();
                                            } catch (e) {
                                                nativeDateRef.current?.focus();
                                            }
                                        }}
                                        className="w-5 h-5 flex items-center justify-center opacity-50"
                                    >
                                        <Calendar size={20} className="text-[#6b7280] dark:text-[#9ca3af]" strokeWidth={2} />
                                    </button>
                                    <input
                                        ref={nativeDateRef}
                                        type="date"
                                        value={log.date}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                        onChange={handleNativeDateChange}
                                        max={format(new Date(), 'yyyy-MM-dd')}
                                    />
                                </div>
                            </div>
                            {dateError && (
                                <p className="text-sm font-medium text-red-500 mt-2">{dateError}</p>
                            )}
                        </div>

                        {/* Note Field */}
                        <div className="mb-8">
                            <label htmlFor="edit-note" className="block text-[13px] font-semibold uppercase mb-3 text-[#6b7280] dark:text-[#9ca3af]" style={{ letterSpacing: '0.5px' }}>
                                NOTE (OPTIONAL)
                            </label>
                            <textarea
                                id="edit-note"
                                placeholder="Add details here"
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full px-5 py-4 text-base rounded-2xl border-none bg-[#f5f7fa] dark:bg-[#2a3142] text-[#1a1f2e] dark:text-white placeholder:opacity-50 placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] outline-none transition-all duration-200 focus:-translate-y-0.5 focus:shadow-[0_4px_12px_rgba(59,130,246,0.15),inset_0_2px_4px_rgba(0,0,0,0.04)] dark:focus:shadow-[0_4px_12px_rgba(59,130,246,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] resize-y"
                                style={{ 
                                    minHeight: '120px',
                                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)'
                                }}
                            />
                            <p className="text-xs mt-2 opacity-60 text-[#6b7280] dark:text-[#9ca3af]">
                                Add details about what you did
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-8 pb-8 pt-0 shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 px-4 rounded-2xl text-base font-semibold border-none cursor-pointer transition-all duration-200 bg-transparent text-[#6b7280] dark:text-[#9ca3af] hover:bg-[rgba(107,114,128,0.1)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !!dateError}
                            className="flex-1 py-4 px-4 rounded-2xl text-base font-semibold border-none cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-[#3b82f6] text-white hover:bg-[#2563eb] hover:-translate-y-0.5"
                            style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

