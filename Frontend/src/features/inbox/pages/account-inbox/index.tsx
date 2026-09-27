'use client';

import { Keyboard } from 'lucide-react';
import React, { Suspense } from 'react';

import KeyboardShortcutsModal from '@features/emails/components/KeyboardShortcutsModal';
import DeleteModal from '@features/emails/components/DeleteModal';
import EmailListTable from '@features/inbox/components/EmailListTable';
import EmailMenuBarOptions from '@features/inbox/components/EmailMenuBarOptions';
import { useInboxPage } from '@features/inbox/hooks';
import { Filter } from '@mailsense/types';
import APILoader from '@shared/components/apiLoader';
import SearchHeader from '@shared/components/inputs/SearchHeader';
import Loader from '@shared/components/loader';
import PaginationComponent from '@shared/components/table/Pagination';
import FilterModal from '@shared/components/utils/FilterModal';
import { UI_CONSTANTS } from '@shared/constants';
import { useIsMobile } from '@shared/hooks';
import { Button } from '@shared/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';

const AccountInboxPage: React.FC<{ account: string }> = ({ account }) => {
    const isMobile = useIsMobile();

    const {
        emails: { data: emailsData, fetchEmailsData, isLoadingEmails },
        emailFilterOptions: { data: filterOptions },
        actions: { handleEmailSelect, handlePageSizeChange, handleResetPage, handleResetSelection, handleConfirmDelete },
        states: { selectedEmails, page, pageSize, searchValue, filter, focusedIndex, isShortcutsModalOpen, emailsToDelete },
        setters: { setPage, setSearchValue, setFilter, setIsShortcutsModalOpen, setEmailsToDelete },
    } = useInboxPage(account);

    return (
        <>
            <div className="flex items-center justify-center gap-4 px-4 py-2">
                <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                    <APILoader show={isLoadingEmails} />
                    <div className="flex w-full gap-2">
                        <FilterModal filter={filter} onFilterChange={(value: Filter) => setFilter(value)} filterOptions={filterOptions || []} />
                        <SearchHeader value={searchValue} onChange={setSearchValue} placeholder={UI_CONSTANTS.PLACEHOLDERS.SEARCH_EMAILS} />
                        <EmailMenuBarOptions
                            emailIds={selectedEmails}
                            allEmails={emailsData?.data || []}
                            onRefetchEmails={fetchEmailsData}
                            onResetSelection={handleResetSelection}
                            onResetPage={handleResetPage}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsShortcutsModalOpen(true)}
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
                    </div>
                    <div className={`flex w-full flex-col ${isMobile ? 'h-[calc(100vh-200px)]' : 'h-[calc(100vh-150px)]'}`}>
                        <EmailListTable
                            data={emailsData?.data || []}
                            page={page}
                            selectedEmails={selectedEmails}
                            focusedIndex={focusedIndex}
                            onEmailSelect={handleEmailSelect}
                            onDeleteSuccess={fetchEmailsData}
                            onDeleteRequest={(email) => setEmailsToDelete([email._id])}
                        />
                    </div>
                    <PaginationComponent
                        total={emailsData?.total || 0}
                        currentPage={page}
                        onPageChange={setPage}
                        onPageSizeChange={handlePageSizeChange}
                        pageSize={pageSize}
                    />
                </div>
            </div>
            <KeyboardShortcutsModal isOpen={isShortcutsModalOpen} onClose={() => setIsShortcutsModalOpen(false)} />
            <DeleteModal
                open={emailsToDelete.length > 0}
                onOpenChange={(open) => {
                    if (!open) setEmailsToDelete([]);
                }}
                onDelete={handleConfirmDelete}
                title={emailsToDelete.length > 1 ? 'Delete Emails' : 'Delete Email'}
                description={
                    emailsToDelete.length > 1
                        ? `Are you sure you want to delete ${emailsToDelete.length} emails?`
                        : 'Are you sure you want to delete this email?'
                }
            />
        </>
    );
};

const AccountInboxPageWrapper: React.FC<{ account: string }> = ({ account }) => (
    <Suspense fallback={<Loader />}>
        <AccountInboxPage account={account} />
    </Suspense>
);

export default AccountInboxPageWrapper;
