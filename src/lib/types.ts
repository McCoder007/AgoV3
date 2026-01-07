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
];

// Default color palette for categories (16 accessible colors with 6:1 contrast ratio)
export const DEFAULT_CATEGORY_COLORS = [
  '#B91C1C', // Red
  '#9A3412', // Orange
  '#92400E', // Amber
  '#78350F', // Yellow
  '#365314', // Lime
  '#166534', // Green
  '#065F46', // Emerald
  '#134E4A', // Teal
  '#164E63', // Cyan
  '#0C4A6E', // Sky
  '#1E40AF', // Blue
  '#3730A3', // Indigo
  '#5B21B6', // Violet
  '#6B21A8', // Purple
  '#86198F', // Fuchsia
  '#9F1239', // Pink
];
