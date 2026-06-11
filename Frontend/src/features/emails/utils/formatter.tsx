export const formatEmailFromString = (from: string) => {
    if (!from) return '';
    if (from.includes('<')) {
        const parts = from.split('<');
        return (
            <>
                <span className="text-sm font-medium">{parts[0].trim()}</span>
                <span className="text-muted-foreground ml-1 text-xs font-light">&lt;{parts[1]?.replace('>', '')}&gt;</span>
            </>
        );
    }
    return <p className="text-sm font-medium">{from}</p>;
};
