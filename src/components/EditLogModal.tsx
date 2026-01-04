'use client';

import { useState, useEffect } from 'react';
import { LogEntry } from '@/lib/types';
import { parseDateOnly } from '@/lib/dateUtils';
import { X, Calendar, Save } from 'lucide-react';

interface EditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: LogEntry | null;
    onSave: (date: string, note?: string) => Promise<void>;
}

export function EditLogModal({ isOpen, onClose, log, onSave }: EditLogModalProps) {
    const [date, setDate] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (log) {
            setDate(log.date);
            setNote(log.note || '');
        }
    }, [log]);

    if (!isOpen || !log) return null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(date, note.trim() || undefined);
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
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Log</h2>
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
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Calendar size={18} />
                                </div>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                />
                            </div>
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
                                disabled={saving}
                                className="flex-1 py-3.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-black font-semibold text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save size={18} />
                                Save Log
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

