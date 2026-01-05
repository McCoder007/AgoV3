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

    const dateInputRef = useRef<HTMLInputElement>(null);
    const nativeDateRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (log) {
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
        }
    }, [log]);

    if (!isOpen || !log) return null;

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
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 pb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-5 pb-5 space-y-5">
                        {/* Date Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    ref={dateInputRef}
                                    type="text"
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
                                            // Fallback for older browsers
                                            nativeDateRef.current?.focus();
                                        }
                                    }}
                                    placeholder="mm/dd/yyyy"
                                    className={clsx(
                                        "w-full pl-4 pr-12 py-3.5 text-lg rounded-xl border bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 outline-none transition-all",
                                        dateError 
                                            ? "border-red-500 focus:ring-red-500/20" 
                                            : "border-gray-200 dark:border-gray-800 focus:ring-blue-500/20 focus:border-blue-500"
                                    )}
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                try {
                                                    (nativeDateRef.current as any)?.showPicker();
                                                } catch (e) {
                                                    nativeDateRef.current?.focus();
                                                }
                                            }}
                                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        >
                                            <Calendar size={24} />
                                        </button>
                                        <input
                                            ref={nativeDateRef}
                                            type="date"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                                            onChange={handleNativeDateChange}
                                            max={format(new Date(), 'yyyy-MM-dd')}
                                        />
                                    </div>
                                </div>
                            </div>
                            {dateError && (
                                <p className="text-sm font-medium text-red-500 ml-1">{dateError}</p>
                            )}
                        </div>

                        {/* Note Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                Note (Optional)
                            </label>
                            <textarea
                                placeholder="Added new oil filter..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-full border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !!dateError}
                                className="flex-1 py-3.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

