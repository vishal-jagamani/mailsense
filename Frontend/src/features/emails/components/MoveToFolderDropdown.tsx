'use client';

import { Check, Folder, Loader2, Search, X } from 'lucide-react';
import React from 'react';

import { Button } from '@shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { useMoveToFolderDropdown } from '../hooks/use-move-to-folder-dropdown';
import { MoveToFolderDropdownProps } from '../types';

export const MoveToFolderDropdown: React.FC<MoveToFolderDropdownProps> = (props) => {
    const {
        states: { isOpen, searchQuery, isDisabled, searchedFolders, tooltipMessage },
        setters: { setSearchQuery },
        folders: { loading: isLoadingFolders },
        actions: { handleOpenChange, handleSelectFolder, moveEmailsMutation },
    } = useMoveToFolderDropdown(props);

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
                            const isCurrent = folder._id === props.currentFolderId;
                            return (
                                <button
                                    key={folder._id}
                                    type="button"
                                    onClick={() => handleSelectFolder(folder._id)}
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
