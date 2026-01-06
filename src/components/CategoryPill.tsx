'use client';

import { getCategoryColors } from '@/lib/colorUtils';

interface CategoryPillProps {
  categoryName: string;
  customColor?: string;
  isDark: boolean;
  className?: string;
}

/**
 * Shared CategoryPill component with consistent sizing and colors.
 * Uses custom color if provided, otherwise falls back to semantic colors.
 * Uses exact specifications (reduced by 25%):
 * - Font: 9.75px, weight 600, letter-spacing 0.225px, uppercase
 * - Padding: 4.5px vertical, 10.5px horizontal
 * - Border radius: 4.5px
 * - Display: inline-block, white-space: nowrap
 */
export function CategoryPill({ categoryName, customColor, isDark, className = '' }: CategoryPillProps) {
  const colors = getCategoryColors(categoryName, customColor, isDark);

  return (
    <span
      className={`inline-block whitespace-nowrap ${className}`}
      style={{
        fontSize: '9.75px',
        fontWeight: 600,
        letterSpacing: '0.225px',
        textTransform: 'uppercase',
        padding: '4.5px 10.5px',
        borderRadius: '4.5px',
        backgroundColor: colors.backgroundColor,
        color: colors.color,
        border: isDark ? `1px solid ${colors.color}20` : 'none',
      }}
    >
      {categoryName}
    </span>
  );
}

