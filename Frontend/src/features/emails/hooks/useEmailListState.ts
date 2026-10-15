'use client';

import { EmailAttributes, PaginatedDataResponse } from '@mailsense/types';
import { useState } from 'react';
import { UseEmailListStateReturn } from '../types/email-ui.types';

export function useEmailListState(): UseEmailListStateReturn {
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);
    const [emailsData, setEmailsData] = useState<PaginatedDataResponse<EmailAttributes> | null>(null);

    const handleEmailSelect = (emailIds: string[]): void => {
        setSelectedEmails(emailIds);
    };

    const handleResetSelection = (): void => {
        setSelectedEmails([]);
    };

    return {
        selectedEmails,
        focusedIndex,
        emailsData,
        setSelectedEmails,
        setFocusedIndex,
        setEmailsData,
        handleEmailSelect,
        handleResetSelection,
    };
}
