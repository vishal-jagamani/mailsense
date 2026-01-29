import { useEffect, useState } from 'react';

interface UseDebounceQueryProps {
    text: string;
    delay?: number;
}

export const UseDebounceQuery = ({ text, delay = 300 }: UseDebounceQueryProps): string => {
    const [debouncedText, setDebouncedText] = useState<string>(text);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedText(text);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [text, delay]);
    return debouncedText;
};
