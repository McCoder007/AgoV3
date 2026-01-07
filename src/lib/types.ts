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

// Default color palette for categories (16 accessible colors)
// Uses text colors from the new semantic color system
// For colors that share dark mode text colors (mint/emerald, violet/purple, bronze/amber),
// we use the light mode text color as the identifier to ensure uniqueness
export const DEFAULT_CATEGORY_COLORS = [
  '#5EEAD4', // Teal (dark mode text)
  '#6EE7B7', // Emerald (dark mode text)
  '#7DD3FC', // Sky Blue (dark mode text)
  '#C4B5FD', // Purple (dark mode text)
  '#FDA4AF', // Rose (dark mode text)
  '#FCD34D', // Amber (dark mode text)
  '#FDBA74', // Coral (dark mode text)
  '#A5B4FC', // Indigo (dark mode text)
  '#67E8F9', // Cyan (dark mode text)
  '#BEF264', // Lime (dark mode text)
  '#E879F9', // Fuchsia (dark mode text)
  '#FCA5A5', // Red (dark mode text)
  '#CBD5E1', // Slate (dark mode text)
  '#10B981', // Mint (light mode text - unique identifier)
  '#8B5CF6', // Violet (light mode text - unique identifier)
  '#B45309', // Bronze (light mode text - unique identifier)
];
