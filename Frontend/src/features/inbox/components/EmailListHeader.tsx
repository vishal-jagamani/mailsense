'use client';

import { Keyboard } from 'lucide-react';
import React from 'react';

import { EmailAttributes, Filter, FilterOption } from '@mailsense/types';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import FilterModal from '@shared/components/utils/FilterModal';
import { UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Button } from '@shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import EmailMenuBarOptions from './EmailMenuBarOptions';

interface EmailListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    filter: Filter | null;
    setFilter: (value: Filter) => void;
    selectedEmails: string[];
    allEmails?: EmailAttributes[];
    handleResetSelection: () => void;
    handleResetPage: () => void;
    emailFilterOptions: FilterOption[];
    fetchEmailsData: () => void;
    onOpenShortcutsModal?: () => void;
}

const EmailListHeader: React.FC<EmailListHeaderProps> = (props) => {
    const {
        searchValue,
        setSearchValue,
        filter,
        setFilter,
        selectedEmails,
        allEmails,
        handleResetSelection,
        handleResetPage,
        emailFilterOptions,
        fetchEmailsData,
        onOpenShortcutsModal,
    } = props;
    const isMobile = useIsMobile();

    return (
        <>
            {isMobile ? (
                <div className="flex w-full flex-col items-center gap-2">
                    <div className="flex w-full items-center gap-2">
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        {onOpenShortcutsModal && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={onOpenShortcutsModal}
                                        className="size-9 shrink-0 cursor-pointer"
                                        aria-label="Keyboard Shortcuts"
                                    >
                                        <Keyboard className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Keyboard Shortcuts (?)</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    <div className="flex w-full justify-between">
                        <FilterModal filter={filter} onFilterChange={(value) => setFilter(value)} filterOptions={emailFilterOptions || []} />
                        <EmailMenuBarOptions
                            emailIds={selectedEmails}
                            allEmails={allEmails}
                            onResetSelection={handleResetSelection}
                            onResetPage={handleResetPage}
                            onRefetchEmails={fetchEmailsData}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex w-full items-center gap-2">
                    <FilterModal filter={filter} onFilterChange={(value) => setFilter(value)} filterOptions={emailFilterOptions || []} />
                    <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                    <EmailMenuBarOptions
                        emailIds={selectedEmails}
                        allEmails={allEmails}
                        onRefetchEmails={fetchEmailsData}
                        onResetSelection={handleResetSelection}
                        onResetPage={handleResetPage}
                    />
                    {onOpenShortcutsModal && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onOpenShortcutsModal}
                                    className="size-9 shrink-0 cursor-pointer"
                                    aria-label="Keyboard Shortcuts"
                                >
                                    <Keyboard className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs">Keyboard Shortcuts (?)</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            )}
        </>
    );
};

export default EmailListHeader;
