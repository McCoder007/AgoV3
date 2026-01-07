'use client';

import { useState, useEffect, useRef } from 'react';
import { usePreferences, useCategories, useItems } from '@/hooks/useData';
import { categoriesRepo } from '@/lib/storage/categoriesRepo';
import { clearDatabase } from '@/lib/storage/db';
import { prefsRepo } from '@/lib/storage/prefsRepo';
import { Moon, Sun, Monitor, Type, AlignJustify, Plus, Trash2, Edit2, AlertTriangle, X, Check, Tag, Palette } from 'lucide-react';
import clsx from 'clsx';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/types';
import { getCategoryColors, getCategoryStyles, CATEGORY_COLOR_VARIANTS, findColorVariant } from '@/lib/colorUtils';
import { applyTheme } from '@/lib/themeUtils';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsSheet({ isOpen, onClose }: SettingsSheetProps) {
  const { prefs, updatePrefs } = usePreferences();
  const { categories, reload: reloadCats } = useCategories();
  const { items } = useItems();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState<Record<string, { top: number; left: number; placement: 'top' | 'bottom' }>>({});
  const colorPickerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const themes = [
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ] as const;

  const densities = [
    { value: 'regular', label: 'Regular', icon: AlignJustify },
    { value: 'compact', label: 'Compact', icon: Type },
  ] as const;

  const handleApplyTheme = async (theme: typeof prefs.theme) => {
    // Apply theme immediately for instant feedback
    applyTheme(theme);
    // Update preferences - this will trigger useEffect to re-apply as a safeguard
    try {
      await updatePrefs({ theme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Even if save fails, theme is already applied, so user sees the change
    }
  };

  // Detect dark mode for color picker contrast
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Watch for dark mode changes (e.g. from system or other components)
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Theme is handled globally by ClientInit, 
  // we only need to handle the case where preferences change locally
  useEffect(() => {
    applyTheme(prefs.theme);
  }, [prefs.theme]);

  const handleDeleteCategory = async (id: string) => {
    // Check if items use this category
    const itemsInCat = items.filter(i => i.categoryId === id);
    if (itemsInCat.length > 0) {
      if (!confirm(`This category has ${itemsInCat.length} items. They will be moved to "Uncategorized". Continue?`)) {
        return;
      }

      // Find or Create "Uncategorized"
      let fallback = categories.find(c => c.name === 'Uncategorized');
      if (!fallback) {
        fallback = await categoriesRepo.create('Uncategorized');
      }

      await categoriesRepo.delete(id, fallback.id);
    } else {
      if (!confirm('Delete this category?')) return;
      await categoriesRepo.delete(id);
    }
    reloadCats();
  };

  const startEdit = (cat: typeof categories[0]) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async (id: string) => {
    if (editName.trim()) {
      await categoriesRepo.update(id, { name: editName.trim() });
      setEditingId(null);
      reloadCats();
    }
  };

  const addCategory = async () => {
    if (newCatName.trim()) {
      await categoriesRepo.create(newCatName.trim());
      setNewCatName('');
      setIsAdding(false);
      reloadCats();
    }
  };

  const handleColorChange = async (categoryId: string, color: string) => {
    await categoriesRepo.update(categoryId, { color });
    reloadCats();
    setEditingColorId(null);
  };

  // Calculate picker position when it opens
  useEffect(() => {
    if (editingColorId === null) return;

    const button = colorPickerRefs.current[editingColorId];
    if (!button) return;

    const calculatePosition = () => {
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const pickerHeight = 180; // Approximate height of color picker (4 rows * 40px + padding)
      const pickerWidth = 180; // min-w-[180px]
      const gap = 8; // mt-2 or mb-2 gap
      
      // Determine placement (above or below)
      const placement: 'top' | 'bottom' = spaceBelow < pickerHeight && spaceAbove > pickerHeight ? 'top' : 'bottom';
      
      // Calculate top position
      let top: number;
      if (placement === 'top') {
        top = rect.top - pickerHeight - gap;
      } else {
        top = rect.bottom + gap;
      }
      
      // Calculate left position (align with button, but keep within viewport)
      let left = rect.left;
      const rightEdge = left + pickerWidth;
      if (rightEdge > viewportWidth) {
        left = viewportWidth - pickerWidth - 16; // 16px padding from edge
      }
      if (left < 16) {
        left = 16; // 16px padding from edge
      }
      
      setPickerPosition(prev => ({ 
        ...prev, 
        [editingColorId]: { top, left, placement } 
      }));
    };

    // Calculate immediately with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(calculatePosition, 0);

    // Recalculate on scroll or resize
    const scrollContainer = button.closest('.overflow-y-auto');
    const handleScroll = () => calculatePosition();
    const handleResize = () => calculatePosition();
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, true);
    }
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll, true);
      }
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [editingColorId]);

  // Close color picker when clicking outside
  useEffect(() => {
    if (editingColorId === null) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-color-picker]')) {
        setEditingColorId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingColorId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out max-h-[85vh] flex flex-col">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          <div className="space-y-8">
            {/* Appearance */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Appearance</h2>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Theme</label>
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {themes.map(t => (
                      <button
                        key={t.value}
                        onClick={() => handleApplyTheme(t.value)}
                        className={clsx(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                          prefs.theme === t.value
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <t.icon size={16} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Density</label>
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {densities.map(t => (
                      <button
                        key={t.value}
                        onClick={() => updatePrefs({ density: t.value })}
                        className={clsx(
                          "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                          prefs.density === t.value
                            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                      >
                        <t.icon size={16} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Categories */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categories</h2>
                <button onClick={() => setIsAdding(true)} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-lg transition-colors">
                  <Plus size={20} />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {isAdding && (
                  <div className="p-3 flex items-center gap-2 animate-in slide-in-from-top-2">
                    <input
                      autoFocus
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="Category name"
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      onKeyDown={e => e.key === 'Enter' && addCategory()}
                    />
                    <button onClick={addCategory} className="text-blue-600 font-medium px-3 text-sm">Add</button>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400 px-2">
                      <X size={18} />
                    </button>
                  </div>
                )}

                {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((cat) => (
                  <div key={cat.id} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                    {editingId === cat.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
                          onKeyDown={e => e.key === 'Enter' && saveEdit(cat.id)}
                        />
                        <button onClick={() => saveEdit(cat.id)} className="text-green-600 p-2">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 p-2">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 flex items-center gap-3">
                          {/* Color preview/swatch with picker */}
                          <div className="relative" data-color-picker>
                            <button
                              ref={(el) => { colorPickerRefs.current[cat.id] = el; }}
                              type="button"
                              onClick={() => setEditingColorId(editingColorId === cat.id ? null : cat.id)}
                              className={clsx(
                                "w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center",
                                "hover:scale-110 hover:shadow-md",
                                editingColorId === cat.id 
                                  ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 border-transparent"
                                  : "border-gray-200 dark:border-gray-700"
                              )}
                              style={getCategoryColors(cat.name, cat.color, isDarkMode)}
                              title="Change color"
                            >
                              {!cat.color && <Palette size={14} className="text-gray-400" />}
                            </button>
                            {editingColorId === cat.id && pickerPosition[cat.id] && (
                              <div 
                                className="fixed z-[60] bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-3 min-w-[180px]"
                                style={{
                                  top: `${pickerPosition[cat.id].top}px`,
                                  left: `${pickerPosition[cat.id].left}px`,
                                }}
                              >
                                <div className="grid grid-cols-4 gap-2">
                                  {DEFAULT_CATEGORY_COLORS.map((color) => {
                                    const variant = findColorVariant(color);
                                    const modeColors = variant ? (isDarkMode ? variant.dark : variant.light) : null;
                                    return (
                                      <button
                                        key={color}
                                        onClick={() => handleColorChange(cat.id, color)}
                                        className={clsx(
                                          "w-8 h-8 rounded-full border-2 transition-transform active:scale-90 relative overflow-hidden",
                                          cat.color === color ? "border-black dark:border-white scale-110 ring-2 ring-offset-1 ring-blue-500 dark:ring-blue-400" : "border-transparent hover:scale-110"
                                        )}
                                        style={modeColors ? {
                                          backgroundColor: modeColors.bg,
                                        } : { backgroundColor: color }}
                                        title={variant ? `${variant.textColor}` : color}
                                      >
                                        {modeColors && (
                                          <div
                                            className="absolute inset-0 flex items-center justify-center"
                                            style={{ color: modeColors.text }}
                                          >
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: modeColors.text }}
                                            />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                  {/* Clear/Reset to semantic option */}
                                  <button
                                    onClick={() => handleColorChange(cat.id, '')}
                                    className={clsx(
                                      "w-8 h-8 rounded-full border-2 transition-transform active:scale-90 flex items-center justify-center bg-gray-100 dark:bg-gray-700",
                                      !cat.color ? "border-black dark:border-white scale-110" : "border-transparent hover:scale-110"
                                    )}
                                    title="Reset to semantic color"
                                  >
                                    <X size={14} className="text-gray-500" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 hover:text-blue-500">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Danger Zone */}
            <section>
              <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">Danger Zone</h2>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">Clear All Data</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Delete all items, logs, categories, and preferences. This cannot be undone.
                      </p>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
                            await clearDatabase();
                            onClose();
                            window.location.href = '/';
                          }
                        }}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Clear Everything
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

