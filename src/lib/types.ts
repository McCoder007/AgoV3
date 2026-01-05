export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string; // ISO string
  color?: string; // Hex color string
}

export interface Item {
  id: string;
  title: string;
  categoryId: string;
  createdAt: string; // YYYY-MM-DD
}

export interface LogEntry {
  id: string;
  itemId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string; // ISO string for sorting
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type DensityPreference = 'regular' | 'compact';

export interface UserPreferences {
  theme: ThemePreference;
  density: DensityPreference;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  density: 'regular',
};

export const DEFAULT_CATEGORIES = [
  'Home',
  'Car',
  'Health',
  'Fitness',
  'Pets',
  'Tech',
  'Finance',
  'People',
  'Personal',
  'Work',
  'Life Admin',
];

// Default color palette for categories (12 accessible colors)
export const DEFAULT_CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#D946EF', // Fuchsia
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#EC4899', // Pink
];
