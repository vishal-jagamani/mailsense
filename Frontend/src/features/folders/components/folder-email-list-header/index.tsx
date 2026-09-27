'use client';

import { Keyboard } from 'lucide-react';
import React from 'react';

import { AccountAttributes, EmailAttributes, Filter, FILTER_OPTION_TYPE, FilterOption } from '@mailsense/types';
import EmailMenuBarOptions from '@features/inbox/components/EmailMenuBarOptions';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import FilterModal from '@shared/components/utils/FilterModal';
import { DATE_RANGE_DROPDOWN_OPTIONS, UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Button } from '@shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';

interface FolderEmailListHeaderProps {
    searchValue: string;
    setSearchValue: (value: string) => void;
    accounts: AccountAttributes[];
    filter: Filter | null;
    setFilter: (value: Filter) => void;
    selectedEmails: string[];
    allEmails?: EmailAttributes[];
    handleResetSelection: () => void;
    handleResetPage: () => void;
    fetchEmailsData: () => void;
    onOpenShortcutsModal?: () => void;
}

const FolderEmailListHeader: React.FC<FolderEmailListHeaderProps> = (props) => {
    const {
        searchValue,
        setSearchValue,
        accounts,
        filter,
        setFilter,
        selectedEmails,
        allEmails,
        handleResetSelection,
        handleResetPage,
        fetchEmailsData,
        onOpenShortcutsModal,
    } = props;
    const isMobile = useIsMobile();

    const filterOptions: FilterOption[] = [
        {
            id: 1,
            name: 'accountId',
            type: FILTER_OPTION_TYPE.DROPDOWN,
            label: 'Accounts',
            data:
                accounts?.map((account) => {
                    return {
                        id: account._id,
                        name: account._id,
                        label: account.emailAddress,
                        provider: account.provider,
                        selectedValue: '',
                    };
                }) || [],
        },
        {
            id: 2,
            name: 'dateRange',
            label: 'Date Range',
            type: FILTER_OPTION_TYPE.DROPDOWN,
            data: DATE_RANGE_DROPDOWN_OPTIONS.map((item) => {
                return {
                    id: item.name,
                    name: item.name,
                    label: item.label,
                    selectedValue: '',
                };
            }),
        },
    ];

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
                        <FilterModal filter={filter} onFilterChange={(value: Filter) => setFilter(value)} filterOptions={filterOptions} />
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
                    <FilterModal filter={filter} onFilterChange={(value: Filter) => setFilter(value)} filterOptions={filterOptions} />
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

export default FolderEmailListHeader;
