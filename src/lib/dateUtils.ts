/**
 * Parses a YYYY-MM-DD string into a Date object treated as local midnight.
 * Crucially, prevents timezone shifts by handling the string manually.
 */
export function parseDateOnly(dateStr: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        throw new Error(`Invalid date format: ${dateStr}`);
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

/**
 * Returns the number of days between two YYYY-MM-DD strings.
 * fromDate - toDate. (e.g. today - yesterday = 1)
 */
export function diffDaysDateOnly(fromDateStr: string, toDateStr: string): number {
    const from = parseDateOnly(fromDateStr);
    const to = parseDateOnly(toDateStr);
    // Discard time portion safely by using MSTime / 86400000
    // Since we parsed as local midnight, diffing timestamps accounts for DST if local time crosses it? 
    // Actually, UTC approach is safer for "days between" to avoid DST glitches.

    const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((utcFrom - utcTo) / msPerDay);
}

/**
 * Formats the "ago" string based on days difference.
 */
export function formatAgo(diffDays: number): string {
    if (diffDays < 0) return 'In the future'; // Should not happen often but handle safely
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 365) return `${diffDays} days ago`;

    const years = Math.floor(diffDays / 365);
    const days = diffDays % 365;
    return `${years} year${years === 1 ? '' : 's'} ${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * Formats the interval between two dates as a compact string.
 * Under 365 days: "Nd" (e.g., "3d", "25d", "364d")
 * 365 days or more: "Ny Nd" (e.g., "1y 0d", "1y 25d", "2y 3d")
 * Always shows days component, even if 0 (consistent format).
 */
export function formatInterval(deltaDays: number): string {
    if (deltaDays < 365) {
        return `${deltaDays}d`;
    }
    const years = Math.floor(deltaDays / 365);
    const days = deltaDays % 365;
    return `${years}y ${days}d`;
}

/**
 * Get today's date string YYYY-MM-DD
 */
export function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
