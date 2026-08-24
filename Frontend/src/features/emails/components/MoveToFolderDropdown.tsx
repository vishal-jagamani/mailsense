'use client';

import { EmailAttributes, FolderAttributes } from '@mailsense/types';
import { Check, Folder, Loader2, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useGetAllFolders } from '@features/folders/api/folder.queries';
import { useAuthStore } from '@shared/store';
import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { useMoveEmailsMutation } from '../api/email.mutations';

interface MoveToFolderDropdownProps {
    emailIds: string[];
    selectedEmails?: EmailAttributes[];
    allEmails?: EmailAttributes[];
    accountId?: string;
    folders?: FolderAttributes[];
    currentFolderId?: string;
    onSuccess?: () => void;
    disabled?: boolean;
}

export const MoveToFolderDropdown: React.FC<MoveToFolderDropdownProps> = ({
    emailIds,
    selectedEmails,
    allEmails,
    accountId,
    folders,
    currentFolderId,
    onSuccess,
    disabled = false,
}) => {
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
            return allEmails.filter((email) => emailIds.includes(email.providerMessageId) || emailIds.includes(email._id));
        }
        return [];
    }, [selectedEmails, allEmails, emailIds]);

    // Determine unique account IDs among selected emails
    const selectedAccountIds = useMemo(() => {
        if (accountId) return [accountId];
        const accounts = new Set<string>();
        resolvedSelectedEmailObjects.forEach((email) => {
            if (email.accountId) accounts.add(email.accountId);
        });
        return Array.from(accounts);
    }, [accountId, resolvedSelectedEmailObjects]);

    const isMultiAccountSelected = selectedAccountIds.length > 1;
    const singleAccountId = selectedAccountIds.length === 1 ? selectedAccountIds[0] : null;

    // Filter destination folders by target account
    const filteredFolders = useMemo(() => {
        if (!availableFolders.length) return [];
        if (singleAccountId) {
            return availableFolders.filter((folder) => folder.accountId === singleAccountId);
        }
        return availableFolders;
    }, [availableFolders, singleAccountId]);

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
        try {
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

            const res = await moveEmailsMutation.mutateAsync({
                emailIds,
                targetFolderIds: [targetFolderId],
                removeFolderIds,
            });

            if (res?.success) {
                toast.success(`Moved ${res.updatedCount || emailIds.length} email(s) successfully`);
            } else {
                toast.success('Emails moved successfully');
            }

            setIsOpen(false);
            setSearchQuery('');
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast.error(`Failed to move emails: ${errorMessage}`);
            console.error('Failed to move emails to folder:', errorMessage);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className="inline-block">
                        <PopoverTrigger asChild>
                            <Button variant="outline" disabled={isDisabled} className="cursor-pointer">
                                {moveEmailsMutation.isPending ? (
                                    <Loader2 className="text-muted-foreground size-4 animate-spin" />
                                ) : (
                                    <Folder className="text-muted-foreground size-4" />
                                )}
                                <span className="text-nowrap">Move to...</span>
                            </Button>
                        </PopoverTrigger>
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs font-medium">{tooltipMessage}</p>
                </TooltipContent>
            </Tooltip>

            <PopoverContent align="end" className="w-60 overflow-hidden p-0">
                <div className="border-border text-muted-foreground border-b px-3 py-2 text-xs font-semibold tracking-wider uppercase">
                    Select Destination Folder
                </div>

                {/* Search Input Box */}
                <div className="border-border relative border-b px-2 py-1.5">
                    <Search className="text-muted-foreground absolute top-1/2 left-4 size-3.5 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search folders..."
                        className="border-input bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-ring w-full rounded-md border py-1 pr-7 pl-8 text-xs focus:ring-1 focus:outline-none"
                        autoFocus
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2"
                        >
                            <X className="size-3" />
                        </button>
                    )}
                </div>

                {/* Folders List Container */}
                <div className="max-h-48 overflow-y-auto py-1">
                    {isLoadingFolders ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="text-muted-foreground size-5 animate-spin" />
                        </div>
                    ) : searchedFolders.length === 0 ? (
                        <div className="text-muted-foreground px-4 py-3 text-center text-xs">
                            {searchQuery ? 'No matching folders found' : 'No folders available'}
                        </div>
                    ) : (
                        searchedFolders.map((folder) => {
                            const isCurrent = folder._id === currentFolderId;
                            return (
                                <button
                                    key={folder._id}
                                    type="button"
                                    onClick={() => handleSelectFolder(folder.providerFolderId)}
                                    disabled={isCurrent || moveEmailsMutation.isPending}
                                    className={`hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors ${
                                        isCurrent ? 'bg-accent/50 text-muted-foreground cursor-default font-medium' : 'text-foreground'
                                    }`}
                                >
                                    <span className="truncate">{folder.name}</span>
                                    {isCurrent && <Check className="text-muted-foreground size-4" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default MoveToFolderDropdown;
