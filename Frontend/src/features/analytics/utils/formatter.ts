export const formatMinutesToReadableString = (minutes: number | undefined): string => {
    if (minutes === undefined || minutes === null || minutes === 0) {
        return 'N/A';
    }
    if (minutes < 60) {
        return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    if (remainingMins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMins}m`;
};

export const getTopSenderInitials = (nameOrEmail: string): string => {
    if (!nameOrEmail) return 'U';
    const clean = nameOrEmail.trim();
    if (clean.includes(' ')) {
        const parts = clean.split(' ');
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
};
