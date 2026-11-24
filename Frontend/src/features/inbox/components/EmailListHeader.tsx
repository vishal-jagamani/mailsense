'use client';

import { Flag, Keyboard } from 'lucide-react';
import React from 'react';

import { EMAIL_AI_PRIORITY } from '@mailsense/types';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import FilterModal from '@shared/components/utils/FilterModal';
import { UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Button } from '@shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { EmailListHeaderProps } from '../types/inbox-components.types';
import EmailMenuBarOptions from './EmailMenuBarOptions';

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
                    <Button
                        variant={filter?.aiPriority === EMAIL_AI_PRIORITY.HIGH ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            const nextPriority = filter?.aiPriority === EMAIL_AI_PRIORITY.HIGH ? undefined : EMAIL_AI_PRIORITY.HIGH;
                            setFilter(filter ? { ...filter, aiPriority: nextPriority } : { aiPriority: nextPriority });
                        }}
                        className="h-9 cursor-pointer gap-1.5 text-xs"
                    >
                        <Flag className="size-3.5 fill-amber-500/20 text-amber-500" />
                        <span>Priority</span>
                    </Button>
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
