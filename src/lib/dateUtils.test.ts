import { describe, it, expect } from 'vitest';
import { diffDaysDateOnly, formatAgo, parseDateOnly } from './dateUtils';

describe('Date Helpers', () => {
    describe('parseDateOnly', () => {
        it('parses YYYY-MM-DD correctly', () => {
            const date = parseDateOnly('2023-01-01');
            expect(date.getFullYear()).toBe(2023);
            expect(date.getMonth()).toBe(0); // Jan is 0
            expect(date.getDate()).toBe(1);
        });

        it('throws on invalid format', () => {
            expect(() => parseDateOnly('2023/01/01')).toThrow();
        });
    });

    describe('diffDaysDateOnly', () => {
        it('calculates same day as 0', () => {
            expect(diffDaysDateOnly('2023-01-01', '2023-01-01')).toBe(0);
        });

        it('calculates yesterday as 1', () => {
            expect(diffDaysDateOnly('2023-01-02', '2023-01-01')).toBe(1);
        });

        it('calculates future correctly', () => {
            expect(diffDaysDateOnly('2023-01-01', '2023-01-02')).toBe(-1);
        });

        it('handles month boundaries', () => {
            expect(diffDaysDateOnly('2023-02-01', '2023-01-31')).toBe(1);
        });

        it('handles year boundaries', () => {
            expect(diffDaysDateOnly('2024-01-01', '2023-12-31')).toBe(1);
        });
    });

    describe('formatAgo', () => {
        it('formats 0 days as Today', () => {
            expect(formatAgo(0)).toBe('Today');
        });

        it('formats 1 day as Yesterday', () => {
            expect(formatAgo(1)).toBe('Yesterday');
        });

        it('formats X days ago', () => {
            expect(formatAgo(5)).toBe('5 days ago');
            expect(formatAgo(364)).toBe('364 days ago');
        });

        it('formats years and days', () => {
            expect(formatAgo(365)).toBe('1 year 0 days ago');
            expect(formatAgo(366)).toBe('1 year 1 day ago');
            expect(formatAgo(730)).toBe('2 years 0 days ago');
            expect(formatAgo(731)).toBe('2 years 1 day ago');
        });
    });
});
