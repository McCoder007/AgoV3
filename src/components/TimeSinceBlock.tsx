import React from 'react';

interface TimeSinceBlockProps {
    daysAgo: number;
    className?: string;
}

export function TimeSinceBlock({ daysAgo, className = '' }: TimeSinceBlockProps) {
    let topText = '';
    let bottomText = '';

    if (daysAgo === 0) {
        topText = 'Today';
        bottomText = 'TODAY';
    } else if (daysAgo >= 365) {
        const years = Math.floor(daysAgo / 365);
        const days = daysAgo % 365;
        topText = `${years}y ${days}d`;
        bottomText = 'AGO';
    } else {
        topText = daysAgo.toString();
        bottomText = daysAgo === 1 ? 'DAY AGO' : 'DAYS AGO';
    }

    return (
        <div className={`flex flex-col items-end justify-center min-w-[80px] text-right ${className}`}>
            <span className="text-2xl font-bold tabular-nums leading-tight text-gray-900 dark:text-white">
                {topText}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase">
                {bottomText}
            </span>
        </div>
    );
}


