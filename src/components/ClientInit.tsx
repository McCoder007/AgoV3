'use client';

import { useEffect } from "react";
import { seedDefaults } from "@/lib/storage/db";
import { prefsRepo } from "@/lib/storage/prefsRepo";
import { applyTheme } from "@/lib/themeUtils";

export function ClientInit() {
    useEffect(() => {
        let mediaQuery: MediaQueryList | null = null;
        let handleChange: (() => void) | null = null;
        
        const init = async () => {
            // Register Service Worker
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').then(
                        (registration) => {
                            console.log('SW registered: ', registration);
                        },
                        (registrationError) => {
                            console.log('SW registration failed: ', registrationError);
                        }
                    );
                });
            }

            // Start seeding in background
            const seedPromise = seedDefaults();
            
            // Get prefs and apply theme immediately
            // This ensures IndexedDB preference is respected if it differs from localStorage hint
            const prefs = await prefsRepo.get();
            applyTheme(prefs.theme);
            
            // Set up system preference listener
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            handleChange = () => {
                prefsRepo.get().then(currentPrefs => {
                    if (currentPrefs.theme === 'system') {
                        applyTheme('system');
                    }
                });
            };
            mediaQuery.addEventListener('change', handleChange);
            
            await seedPromise;
        };

        init();
        
        // Cleanup function
        return () => {
            if (mediaQuery && handleChange) {
                mediaQuery.removeEventListener('change', handleChange);
            }
        };
    }, []);
    return null;
}
