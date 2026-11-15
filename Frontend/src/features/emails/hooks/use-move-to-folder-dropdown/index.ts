import { useMoveEmailsMutation } from '@features/emails/api/email.mutations';
import { MoveToFolderDropdownProps } from '@features/emails/types';
import { useGetAllFolders } from '@features/folders/api/folder.queries';
import { trackUserAction } from '@shared/monitoring';
import { useAuthStore } from '@shared/store';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useFolderFilterState } from './useFolderFilterState';

export const useMoveToFolderDropdown = (params: MoveToFolderDropdownProps) => {
    const { emailIds, selectedEmails, allEmails, accountId, folders, currentFolderId, onSuccess, disabled = false } = params;
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuthStore();

    // Fetch user folders if not explicitly passed
    const { data: fetchedFoldersData, isLoading: isLoadingFolders } = useGetAllFolders(
        !folders && user?.id ? { userId: user.id, size: 100, page: 1, filters: {} } : null,
    );

    const availableFolders = folders || fetchedFoldersData?.data || [];
    const moveEmailsMutation = useMoveEmailsMutation();

    // Resolve selected email objects from selectedEmails or allEmails matching emailIds
    const resolvedSelectedEmailObjects = useMemo(() => {
        if (selectedEmails && selectedEmails.length > 0) return selectedEmails;
        if (allEmails && emailIds.length > 0) {
            return allEmails.filter((email) => emailIds.includes(email._id));
        }
        return [];
    }, [selectedEmails, allEmails, emailIds]);

    const { isMultiAccountSelected, filteredFolders } = useFolderFilterState({
        emailIds,
        selectedEmails,
        allEmails,
        accountId,
        availableFolders,
        searchQuery,
    });

    // Filter destination folders by search query
    const searchedFolders = useMemo(() => {
        if (!filteredFolders.length) return [];
        if (!searchQuery.trim()) return filteredFolders;
        const query = searchQuery.toLowerCase().trim();
        return filteredFolders.filter((folder) => folder.name.toLowerCase().includes(query));
    }, [filteredFolders, searchQuery]);

    const isDisabled = disabled || emailIds.length === 0 || isMultiAccountSelected || moveEmailsMutation.isPending;

    const tooltipMessage = isMultiAccountSelected
        ? 'Cannot move emails from multiple accounts at once. Select emails from a single account.'
        : emailIds.length === 0
          ? 'Select emails to move'
          : 'Move selected emails to a folder';

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSearchQuery('');
        }
    };

    const handleSelectFolder = async (targetFolderId: string) => {
        if (targetFolderId === currentFolderId || emailIds.length === 0) {
            setIsOpen(false);
            setSearchQuery('');
            return;
        }

        let removeFolderIds: string[] = [];
        if (currentFolderId && currentFolderId !== targetFolderId) {
            removeFolderIds = [currentFolderId];
        } else if (resolvedSelectedEmailObjects.length > 0) {
            const existingFolders = new Set<string>();
            resolvedSelectedEmailObjects.forEach((email) => {
                if (Array.isArray(email.folders)) {
                    email.folders.forEach((fId) => {
                        if (fId !== targetFolderId) existingFolders.add(fId);
                    });
                }
            });
            removeFolderIds = Array.from(existingFolders);
        }

        // Guarantee removeFolderIds never contains targetFolderId
        removeFolderIds = removeFolderIds.filter((fId) => fId !== targetFolderId);

        moveEmailsMutation.mutate(
            {
                emailIds,
                targetFolderIds: [targetFolderId],
                removeFolderIds,
            },
            {
                onSuccess: (res) => {
                    if (res?.success) {
                        const count = res.updatedCount || emailIds.length;
                        toast.success(count > 1 ? `${count} emails moved successfully` : 'Email moved successfully', { duration: 3000 });
                    } else {
                        toast.success('Emails moved successfully', { duration: 3000 });
                    }
                    setIsOpen(false);
                    setSearchQuery('');
                    if (onSuccess) {
                        onSuccess();
                    }
                },
                onError: (error) => {
                    trackUserAction('ui.click', `MoveToFolderDropdown failure: ${error}`, 'error');
                    setIsOpen(false);
                    setSearchQuery('');
                },
            },
        );
    };

    return {
        states: { isOpen, searchQuery, isDisabled, tooltipMessage, searchedFolders },
        setters: { setSearchQuery },
        folders: { loading: isLoadingFolders },
        actions: { handleOpenChange, handleSelectFolder, moveEmailsMutation },
    };
};
