export type ThemePreference = 'system' | 'light' | 'dark';

export function applyTheme(theme: ThemePreference): void {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    let isDark: boolean;
    
    if (theme === 'dark') {
        isDark = true;
    } else if (theme === 'light') {
        isDark = false;
    } else {
        // theme === 'system'
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    // Force remove first, then add if needed to ensure clean state
    root.classList.remove('dark');
    if (isDark) {
        root.classList.add('dark');
    }

    // Save hint for blocking script to prevent FOUC
    try {
        localStorage.setItem('ago-theme', theme);
    } catch (e) {
        // Handle potential localStorage full or private mode errors
    }
}

