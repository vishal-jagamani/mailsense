export const formatDateToMonthDateString = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
    }).format(new Date(date));

export const formatEpochTimeToString = (epochTime: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - epochTime) / 1000);
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
        second: 1,
    };
    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            // Special case for minutes and seconds to show 'just now' for very recent times
            if (unit === 'second' && interval < 30) {
                return 'just now';
            }
            // Handle pluralization
            const unitStr = interval === 1 ? unit : `${unit}s`;
            // For minutes, check if we should show hours and minutes
            if (unit === 'minute' && interval >= 60) {
                const hours = Math.floor(interval / 60);
                const remainingMinutes = interval % 60;
                if (remainingMinutes > 0) {
                    return `${hours} hr ${remainingMinutes} ${remainingMinutes === 1 ? 'min' : 'mins'}`;
                }
                return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
            }
            return `${interval} ${unitStr}`;
        }
    }
    return 'just now';
};

export const formatDateToDateTimeAgoString = (input: string | Date): string => {
    const date = input instanceof Date ? input : new Date(input);
    const timeString = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
    const dateString = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
    function timeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'just now';
    }
    return `${dateString} ${timeString} (${timeAgo(date)})`;
};
