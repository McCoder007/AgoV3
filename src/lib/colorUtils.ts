/**
 * Color utility functions for category colors with accessibility support
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance according to WCAG
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Darken a color by mixing it with black
 */
function darkenColor(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Adjust brightness while preserving saturation and hue
 * This maintains color vibrancy better than simple darkening/lightening
 * factor > 1 lightens, factor < 1 darkens
 */
function adjustBrightness(color: string, factor: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  // Convert to HSL-like adjustment: reduce/increase brightness while maintaining relative RGB ratios
  const r = Math.max(0, Math.min(255, Math.floor(rgb.r * factor)));
  const g = Math.max(0, Math.min(255, Math.floor(rgb.g * factor)));
  const b = Math.max(0, Math.min(255, Math.floor(rgb.b * factor)));

  // If we are lightening and one component hits 255, we need to blend with white to maintain hue as much as possible
  if (factor > 1.0 && (r === 255 || g === 255 || b === 255)) {
    const blendAmount = (factor - 1.0) * 0.5;
    return lightenColor(color, blendAmount);
  }

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Lighten a color by mixing it with white
 */
function lightenColor(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount));

  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Adjust color for dark mode to ensure at least 6:1 contrast ratio with white text
 * Uses brightness adjustment to maintain vibrancy while meeting contrast requirements
 */
export function adjustColorForDarkMode(color: string): string {
  const WHITE = '#FFFFFF';
  const MIN_CONTRAST = 6.0;

  // Check if original color already meets contrast requirement (meaning it's dark enough)
  let whiteOnColorContrast = getContrastRatio(WHITE, color);
  if (whiteOnColorContrast >= MIN_CONTRAST) {
    return color;
  }

  // Binary search for optimal brightness that meets contrast
  // We want the BRIGHTEST (most vibrant) color that still meets 6:1 contrast with white
  let minFactor = 0.1; // Very dark
  let maxFactor = 1.0; // Original brightness
  let bestColor = color;
  let bestContrast = whiteOnColorContrast;

  for (let i = 0; i < 12; i++) {
    const brightnessFactor = (minFactor + maxFactor) / 2;
    const adjustedColor = adjustBrightness(color, brightnessFactor);
    const contrast = getContrastRatio(WHITE, adjustedColor);

    if (contrast >= MIN_CONTRAST) {
      // This is dark enough, try to go brighter to increase vibrancy
      bestColor = adjustedColor;
      bestContrast = contrast;
      minFactor = brightnessFactor;
    } else {
      // Still too bright, need to go darker
      maxFactor = brightnessFactor;
    }
  }

  return bestColor;
}

/**
 * Adjust color for dark mode text (on dark background)
 * Ensures at least 6:1 contrast ratio against a dark background
 */
export function adjustColorForDarkText(color: string): string {
  const DARK_BG = '#0a0a0a'; // Reference dark background
  const MIN_CONTRAST = 6.0;

  let colorOnDarkContrast = getContrastRatio(color, DARK_BG);
  if (colorOnDarkContrast >= MIN_CONTRAST) {
    return color;
  }

  // Binary search for optimal brightness that meets contrast
  // We want the DARKEST color that still meets 6:1 contrast (to maintain maximum saturation)
  let minFactor = 1.0; // Original
  let maxFactor = 4.0; // Much brighter
  let bestColor = color;
  let bestContrast = colorOnDarkContrast;

  for (let i = 0; i < 12; i++) {
    const brightnessFactor = (minFactor + maxFactor) / 2;
    const adjustedColor = adjustBrightness(color, brightnessFactor);
    const contrast = getContrastRatio(adjustedColor, DARK_BG);

    if (contrast >= MIN_CONTRAST) {
      // Bright enough, try to go darker to maintain saturation
      bestColor = adjustedColor;
      bestContrast = contrast;
      maxFactor = brightnessFactor;
    } else {
      // Not bright enough, need to go brighter
      minFactor = brightnessFactor;
    }
  }

  return bestColor;
}

/**
 * Get the best text color (white or black) for a background color
 */
export function getContrastColor(
  backgroundColor: string,
  isDark: boolean
): 'white' | 'black' {
  const WHITE = '#FFFFFF';
  const BLACK = '#000000';
  const LIGHT_BG = '#FFFFFF';
  const DARK_BG = '#0a0a0a';

  // In dark mode, we use adjusted colors and white text
  if (isDark) {
    const adjustedColor = adjustColorForDarkMode(backgroundColor);
    const whiteContrast = getContrastRatio(WHITE, adjustedColor);
    // In dark mode, prefer white text (should be 6:1+)
    return whiteContrast >= 3 ? 'white' : 'black';
  }

  // In light mode, check contrast with both white and black text
  const whiteContrast = getContrastRatio(WHITE, backgroundColor);
  const blackContrast = getContrastRatio(BLACK, backgroundColor);

  // Use the color with better contrast, but prefer black if both are acceptable
  if (blackContrast >= 4.5) return 'black';
  if (whiteContrast >= 4.5) return 'white';

  // Fallback: use whichever has better contrast
  return blackContrast > whiteContrast ? 'black' : 'white';
}

/**
 * Verify if contrast meets accessibility standards
 */
export function ensureAccessibleContrast(
  bgColor: string,
  textColor: 'white' | 'black',
  isDark: boolean
): boolean {
  const WHITE = '#FFFFFF';
  const BLACK = '#000000';
  const MIN_CONTRAST_LIGHT = 4.5;
  const MIN_CONTRAST_DARK = 6.0;

  const minContrast = isDark ? MIN_CONTRAST_DARK : MIN_CONTRAST_LIGHT;
  const textHex = textColor === 'white' ? WHITE : BLACK;

  // In dark mode, use adjusted color
  const colorToCheck = isDark ? adjustColorForDarkMode(bgColor) : bgColor;
  const contrast = getContrastRatio(textHex, colorToCheck);

  return contrast >= minContrast;
}

/**
 * Find a color variant by any of its text colors (dark or light mode)
 */
export function findColorVariant(color: string): typeof CATEGORY_COLOR_VARIANTS[string] | null {
  // First check direct key match (most common case)
  if (CATEGORY_COLOR_VARIANTS[color]) {
    return CATEGORY_COLOR_VARIANTS[color];
  }
  
  // Check if color matches any variant's text color in either mode
  for (const variant of Object.values(CATEGORY_COLOR_VARIANTS)) {
    if (variant.dark.text === color || variant.light.text === color) {
      return variant;
    }
  }
  
  return null;
}

/**
 * Get inline styles for category pills with proper contrast
 * Checks if color matches a predefined variant first, otherwise generates styles
 */
export function getCategoryStyles(
  color: string | undefined,
  isDark: boolean
): { backgroundColor: string; color: string } {
  // Default color if none provided
  const defaultColor = '#6B7280'; // Gray
  const baseColor = color || defaultColor;

  // Check if this color matches one of our predefined variants
  const variant = findColorVariant(baseColor);
  if (variant) {
    // Use the variant's colors directly
    const modeColors = isDark ? variant.dark : variant.light;
    return {
      backgroundColor: modeColors.bg,
      color: modeColors.text
    };
  }

  // Fallback to generated styles for custom colors not in the variant system
  if (isDark) {
    // For Dark Mode: Vibrant colored text on a subtle background
    // This is much more visible and "colored" than white text on a darkened background
    const textColor = adjustColorForDarkText(baseColor);
    
    return {
      backgroundColor: baseColor + '26', // 15% opacity
      color: textColor,
    };
  }

  // In light mode, we want a light background and dark text
  const whiteContrast = getContrastRatio('#FFFFFF', baseColor);
  
  // If the color itself is dark enough to be text, use it as text on light gray?
  // No, let's stick to the traditional light mode pill: light background, dark text
  const textColor = getContrastColor(baseColor, false);
  
  return {
    backgroundColor: baseColor + '20', // ~12% opacity
    color: textColor === 'white' ? '#FFFFFF' : baseColor, // Use color as text if it's dark enough, or just white text if background is dark
  };
}

/**
 * Get Tailwind-compatible classes for category pills
 * Returns an object with className string and inline style object
 */
export function getCategoryPillClasses(
  color: string | undefined,
  isDark: boolean,
  isSelected: boolean = false
): { className: string; style: { backgroundColor: string; color: string; borderColor: string } } {
  const styles = getCategoryStyles(color, isDark);

  // Base classes for pill styling
  const baseClasses =
    'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border';

  // Selected state classes
  const selectedClasses = isSelected
    ? 'shadow-md'
    : 'bg-transparent hover:opacity-90';

  return {
    className: `${baseClasses} ${selectedClasses}`,
    style: {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      borderColor: styles.backgroundColor,
    },
  };
}

/**
 * Category color variants - 16 semantic colors with proper bg/text for light and dark modes
 * Maps text color hex (what's stored in cat.color) to full color definitions
 */
export const CATEGORY_COLOR_VARIANTS: Record<string, { textColor: string; dark: { bg: string; text: string }; light: { bg: string; text: string } }> = {
  '#5EEAD4': { // Teal
    textColor: '#5EEAD4',
    dark: { bg: 'rgba(13, 148, 136, 0.25)', text: '#5EEAD4' },
    light: { bg: 'rgba(204, 251, 241, 0.5)', text: '#0D9488' }
  },
  '#6EE7B7': { // Emerald
    textColor: '#6EE7B7',
    dark: { bg: 'rgba(5, 150, 105, 0.25)', text: '#6EE7B7' },
    light: { bg: 'rgba(209, 250, 229, 0.5)', text: '#059669' }
  },
  '#7DD3FC': { // Sky Blue
    textColor: '#7DD3FC',
    dark: { bg: 'rgba(2, 132, 199, 0.25)', text: '#7DD3FC' },
    light: { bg: 'rgba(224, 242, 254, 0.5)', text: '#0284C7' }
  },
  '#C4B5FD': { // Purple
    textColor: '#C4B5FD',
    dark: { bg: 'rgba(124, 58, 237, 0.25)', text: '#C4B5FD' },
    light: { bg: 'rgba(237, 233, 254, 0.5)', text: '#7C3AED' }
  },
  '#FDA4AF': { // Rose
    textColor: '#FDA4AF',
    dark: { bg: 'rgba(225, 29, 72, 0.25)', text: '#FDA4AF' },
    light: { bg: 'rgba(255, 228, 230, 0.5)', text: '#E11D48' }
  },
  '#FCD34D': { // Amber
    textColor: '#FCD34D',
    dark: { bg: 'rgba(217, 119, 6, 0.25)', text: '#FCD34D' },
    light: { bg: 'rgba(254, 243, 199, 0.5)', text: '#D97706' }
  },
  '#FDBA74': { // Coral
    textColor: '#FDBA74',
    dark: { bg: 'rgba(249, 115, 22, 0.25)', text: '#FDBA74' },
    light: { bg: 'rgba(255, 237, 213, 0.5)', text: '#F97316' }
  },
  '#A5B4FC': { // Indigo
    textColor: '#A5B4FC',
    dark: { bg: 'rgba(79, 70, 229, 0.25)', text: '#A5B4FC' },
    light: { bg: 'rgba(224, 231, 255, 0.5)', text: '#4F46E5' }
  },
  '#67E8F9': { // Cyan
    textColor: '#67E8F9',
    dark: { bg: 'rgba(8, 145, 178, 0.25)', text: '#67E8F9' },
    light: { bg: 'rgba(207, 250, 254, 0.5)', text: '#0891B2' }
  },
  '#BEF264': { // Lime
    textColor: '#BEF264',
    dark: { bg: 'rgba(101, 163, 13, 0.25)', text: '#BEF264' },
    light: { bg: 'rgba(236, 252, 203, 0.5)', text: '#65A30D' }
  },
  '#E879F9': { // Fuchsia
    textColor: '#E879F9',
    dark: { bg: 'rgba(192, 38, 211, 0.25)', text: '#E879F9' },
    light: { bg: 'rgba(245, 208, 254, 0.5)', text: '#C026D3' }
  },
  '#FCA5A5': { // Red
    textColor: '#FCA5A5',
    dark: { bg: 'rgba(220, 38, 38, 0.25)', text: '#FCA5A5' },
    light: { bg: 'rgba(254, 226, 226, 0.5)', text: '#DC2626' }
  },
  '#CBD5E1': { // Slate
    textColor: '#CBD5E1',
    dark: { bg: 'rgba(100, 116, 139, 0.25)', text: '#CBD5E1' },
    light: { bg: 'rgba(226, 232, 240, 0.5)', text: '#475569' }
  },
  '#10B981': { // Mint (using light mode text color as identifier since dark mode shares with emerald)
    textColor: '#10B981',
    dark: { bg: 'rgba(16, 185, 129, 0.25)', text: '#6EE7B7' },
    light: { bg: 'rgba(209, 250, 229, 0.5)', text: '#10B981' }
  },
  '#8B5CF6': { // Violet (using light mode text color as identifier since dark mode shares with purple)
    textColor: '#8B5CF6',
    dark: { bg: 'rgba(139, 92, 246, 0.25)', text: '#C4B5FD' },
    light: { bg: 'rgba(237, 233, 254, 0.5)', text: '#8B5CF6' }
  },
  '#B45309': { // Bronze (using light mode text color as identifier since dark mode shares with amber)
    textColor: '#B45309',
    dark: { bg: 'rgba(180, 83, 9, 0.25)', text: '#FCD34D' },
    light: { bg: 'rgba(254, 215, 170, 0.5)', text: '#B45309' }
  }
};

/**
 * Semantic color mapping for category pills
 * Maps category names to predefined colors for consistent appearance
 * Kept for backward compatibility with category name-based color assignment
 */
const SEMANTIC_COLORS: Record<string, { dark: { bg: string; text: string }; light: { bg: string; text: string } }> = {
  car: {
    dark: { bg: 'rgba(0, 168, 150, 0.25)', text: '#00CCA8' },
    light: { bg: 'rgba(0, 143, 122, 0.15)', text: '#006B5C' }
  },
  personal: {
    dark: { bg: 'rgba(0, 204, 136, 0.25)', text: '#00E88C' },
    light: { bg: 'rgba(0, 170, 112, 0.15)', text: '#008555' }
  },
  home: {
    dark: { bg: 'rgba(66, 135, 245, 0.25)', text: '#5B9FFF' },
    light: { bg: 'rgba(48, 108, 196, 0.15)', text: '#285399' }
  },
  test4: {
    dark: { bg: 'rgba(139, 92, 246, 0.25)', text: '#A78BFA' },
    light: { bg: 'rgba(109, 72, 196, 0.15)', text: '#543A99' }
  },
  test5: {
    dark: { bg: 'rgba(236, 72, 153, 0.25)', text: '#F472B6' },
    light: { bg: 'rgba(196, 56, 122, 0.15)', text: '#992B5F' }
  }
};

/**
 * Get semantic colors for a category based on its name
 * Returns predefined colors for known categories, or gray fallback for unknown categories
 * @param categoryName - The category name (case-insensitive)
 * @param isDark - Whether dark mode is active
 * @returns Object with backgroundColor and color properties
 */
export function getSemanticCategoryColors(
  categoryName: string,
  isDark: boolean
): { backgroundColor: string; color: string } {
  const normalizedName = categoryName.toLowerCase().trim();
  const colors = SEMANTIC_COLORS[normalizedName];
  
  if (colors) {
    const modeColors = isDark ? colors.dark : colors.light;
    return {
      backgroundColor: modeColors.bg,
      color: modeColors.text
    };
  }
  
  // Fallback to gray for unmapped categories
  if (isDark) {
    return {
      backgroundColor: '#1F2937',
      color: '#9CA3AF'
    };
  } else {
    return {
      backgroundColor: '#F3F4F6',
      color: '#6B7280'
    };
  }
}

/**
 * Get category colors with priority: Custom Color > Semantic Color > Gray Fallback
 * This is the main function to use for displaying category colors throughout the app
 * @param categoryName - The category name (for semantic color lookup)
 * @param customColor - Optional custom color from database (cat.color)
 * @param isDark - Whether dark mode is active
 * @returns Object with backgroundColor and color properties
 */
export function getCategoryColors(
  categoryName: string,
  customColor: string | undefined,
  isDark: boolean
): { backgroundColor: string; color: string } {
  // Priority 1: Use custom color if provided
  if (customColor) {
    return getCategoryStyles(customColor, isDark);
  }
  
  // Priority 2: Use semantic color based on category name
  return getSemanticCategoryColors(categoryName, isDark);
}

/**
 * Generate a swipe gradient from a category color
 * Creates a gradient that transitions from the category color to a very light tint
 * @param color - The category color (hex string) or undefined
 * @returns A CSS linear-gradient string
 */
export function getSwipeGradient(color: string | undefined): string {
  // Default gray color if no category color is provided
  const defaultColor = '#6B7280';
  const baseColor = color || defaultColor;
  
  // Create a very light tint of the base color (similar to existing gradients)
  // Using 0.88 to create a very light tint that maintains the color hue
  const lightenedColor = lightenColor(baseColor, 0.88);
  
  // Return gradient in the same format as existing gradients (90deg, from color to lightened)
  return `linear-gradient(90deg, ${baseColor}, ${lightenedColor})`;
}

