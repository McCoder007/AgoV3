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
 * Get inline styles for category pills with proper contrast
 */
export function getCategoryStyles(
  color: string | undefined,
  isDark: boolean
): { backgroundColor: string; color: string } {
  // Default color if none provided
  const defaultColor = '#6B7280'; // Gray
  const baseColor = color || defaultColor;

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

