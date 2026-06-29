import { useEffect, useState } from 'react';

import { UI_CONSTANTS } from '@shared/constants';

interface UseDebounceQueryProps {
    text: string;
    delay?: number;
}

export const UseDebounceQuery = ({ text, delay = UI_CONSTANTS.DEBOUNCE.SEARCH_DELAY }: UseDebounceQueryProps): string => {
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
