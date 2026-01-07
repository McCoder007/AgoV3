'use client';

import { getCategoryColors } from '@/lib/colorUtils';

interface CategoryPillProps {
  categoryName: string;
  customColor?: string;
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
export function CategoryPill({ categoryName, customColor, className = '' }: CategoryPillProps) {
  const lightColors = getCategoryColors(categoryName, customColor, false);
  const darkColors = getCategoryColors(categoryName, customColor, true);

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
        backgroundColor: 'var(--pill-bg)',
        color: 'var(--pill-text)',
        border: '1px solid var(--pill-border)',
        // @ts-ignore
        '--pill-bg': lightColors.backgroundColor,
        '--pill-text': lightColors.color,
        '--pill-border': 'transparent',
      }}
    >
      <style jsx>{`
        span {
          background-color: var(--pill-bg);
          color: var(--pill-text);
          border-color: var(--pill-border);
        }
        :global(.dark) span {
          --pill-bg: ${darkColors.backgroundColor} !important;
          --pill-text: ${darkColors.color} !important;
          --pill-border: ${darkColors.color}20 !important;
        }
      `}</style>
      {categoryName}
    </span>
  );
}

