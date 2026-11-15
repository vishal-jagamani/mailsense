'use client';

import { UseFolderFilterStateParams, UseFolderFilterStateReturn } from '@features/emails/types';
import { EmailAttributes, FolderAttributes } from '@mailsense/types';
import { useMemo } from 'react';

export function useFolderFilterState(params: UseFolderFilterStateParams): UseFolderFilterStateReturn {
    const { emailIds, selectedEmails, allEmails, accountId, availableFolders, searchQuery } = params;

    const resolvedSelectedEmailObjects = useMemo((): EmailAttributes[] => {
        if (selectedEmails && selectedEmails.length > 0) return selectedEmails;
        if (allEmails && emailIds.length > 0) {
            const idSet = new Set(emailIds);
            return allEmails.filter((email) => idSet.has(email._id));
        }
        return [];
    }, [selectedEmails, allEmails, emailIds]);

    const selectedAccountIds = useMemo((): string[] => {
        if (accountId) return [accountId];
        const accounts = new Set<string>();
        resolvedSelectedEmailObjects.forEach((email) => {
            if (email.accountId) accounts.add(email.accountId);
        });
        return Array.from(accounts);
    }, [accountId, resolvedSelectedEmailObjects]);

    const isMultiAccountSelected = selectedAccountIds.length > 1;
    const singleAccountId = selectedAccountIds.length === 1 ? selectedAccountIds[0] : null;

    const filteredFolders = useMemo((): FolderAttributes[] => {
        if (!availableFolders.length) return [];
        let folders = availableFolders;
        if (singleAccountId) {
            folders = folders.filter((folder) => folder.accountId === singleAccountId);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            folders = folders.filter((folder) => folder.name.toLowerCase().includes(query));
        }
        return folders;
    }, [availableFolders, singleAccountId, searchQuery]);

    return { isMultiAccountSelected, filteredFolders };
}
