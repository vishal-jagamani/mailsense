'use client';

import { Clock, Trash2 } from 'lucide-react';
import React from 'react';

import { DraftListTableBodyProps } from '@features/drafts/types';
import { useIsMobile } from '@shared/hooks';
import { Checkbox } from '@shared/ui/checkbox';
import { Table, TableCell, TableRow } from '@shared/ui/table';
import { formatDateToMonthDateString } from '@shared/utils/formatter';

const DraftListTableBody: React.FC<DraftListTableBodyProps> = ({ data, selectedDrafts, handleCheckboxChange, onOpenDraft, onDeleteDraft }) => {
    const isMobile = useIsMobile();

    return (
        <div className="flex-1 overflow-y-auto">
            <Table>
                <tbody>
                    {data.map((draft) => {
                        const isSelected = selectedDrafts.includes(draft._id);
                        return (
                            <TableRow
                                key={draft._id}
                                className={`cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-900/30' : 'hover:bg-muted/50'
                                }`}
                                onClick={() => onOpenDraft(draft._id)}
                            >
                                <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        id={draft._id}
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleCheckboxChange(draft._id, Boolean(checked))}
                                        className="cursor-pointer"
                                    />
                                </TableCell>

                                {isMobile ? (
                                    <TableCell className="flex max-w-64 flex-col">
                                        <p className="text-foreground truncate text-xs font-semibold">
                                            {draft.to && draft.to.length > 0 ? draft.to.join(', ') : '(No Recipient)'}
                                        </p>
                                        <p className="text-foreground/90 truncate text-xs font-medium">{draft.subject}</p>
                                        <p className="text-muted-foreground line-clamp-2 truncate text-[11px]">{draft.snippet}</p>
                                    </TableCell>
                                ) : (
                                    <>
                                        <TableCell className="w-56">
                                            <span className="text-foreground block truncate text-xs font-medium md:text-sm">
                                                {draft.to && draft.to.length > 0 ? (
                                                    draft.to.join(', ')
                                                ) : (
                                                    <span className="text-muted-foreground italic">(No Recipient)</span>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-60 truncate">
                                            <span className="text-foreground font-medium">{draft.subject}</span>
                                            {draft.snippet && <span className="text-muted-foreground"> - {draft.snippet}</span>}
                                        </TableCell>
                                    </>
                                )}

                                <TableCell className="text-muted-foreground w-16 text-xs whitespace-nowrap md:w-28">
                                    <div className="flex items-center gap-1">
                                        <Clock className="hidden size-3 md:inline" />
                                        <span>{formatDateToMonthDateString(draft.lastSavedAt)}</span>
                                    </div>
                                </TableCell>

                                <TableCell className="w-12 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteDraft(draft._id);
                                        }}
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md p-1.5 transition-colors"
                                        title="Delete Draft"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

export default DraftListTableBody;
