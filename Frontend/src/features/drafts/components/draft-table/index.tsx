'use client';

import { FileText } from 'lucide-react';
import React from 'react';

import DataNotFound from '@shared/components/common/DataNotFound';
import { DraftListTableProps } from '../../types';
import DraftListTableBody from './DraftListTableBody';
import DraftListTableHeader from './DraftListTableHeader';

export const DraftListTable: React.FC<DraftListTableProps> = ({ data, selectedDrafts, onDraftSelect, onDeleteDraft, onOpenDraft }) => {
    if (!data || data.length === 0) {
        return <DataNotFound title="No Drafts Saved" description="Emails you compose auto-save here until sent." icon={FileText} />;
    }

    const allSelected = data.length > 0 && selectedDrafts.length === data.length;

    const handleSelectAll = () => {
        if (allSelected) {
            onDraftSelect([]);
        } else {
            onDraftSelect(data.map((d) => d._id));
        }
    };

    const handleCheckboxChange = (draftId: string, checked: boolean) => {
        try {
            if (checked) {
                onDraftSelect([...selectedDrafts, draftId]);
            } else {
                onDraftSelect(selectedDrafts.filter((id) => id !== draftId));
            }
        } catch (error) {
            console.error('Error changing draft selection', error);
        }
    };

    return (
        <div className="flex h-full w-full flex-col">
            {/* Fixed Table Header */}
            <DraftListTableHeader allSelected={allSelected} handleSelectAll={handleSelectAll} />

            {/* Scrollable Table Body */}
            <DraftListTableBody
                data={data}
                selectedDrafts={selectedDrafts}
                handleCheckboxChange={handleCheckboxChange}
                onOpenDraft={onOpenDraft}
                onDeleteDraft={onDeleteDraft}
            />
        </div>
    );
};

export default DraftListTable;
