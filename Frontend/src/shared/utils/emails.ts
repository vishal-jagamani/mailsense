export const getFormattedEmailTo = (to: string | string[] | undefined, userEmail: string | undefined): string => {
    if (!to) return '';
    const toArray = Array.isArray(to) ? to : [to];
    if (toArray.length === 0) return '';

    const formatted = toArray.map((recipient) => {
        if (!recipient) return '';
        const match = recipient.match(/<([^>]+)>/);
        const emailAddress = match ? match[1].trim() : recipient.trim();
        if (userEmail && emailAddress.toLowerCase() === userEmail.toLowerCase()) {
            return 'Me';
        }
        return recipient;
    });

    return formatted.filter(Boolean).join(', ');
};
