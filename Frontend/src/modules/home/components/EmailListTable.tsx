'use client';

import { Email } from '@/shared/types/email.types';
import { Checkbox } from '@/shared/ui/checkbox';
import { Table, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { formatDateToMonthDateString } from '@/shared/utils/formatter';
import { Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDeleteEmail } from '../services/useHomeApi';

interface EmailListTableProps {
    data: Email[];
}

const EmailListTable: React.FC<EmailListTableProps> = ({ data }) => {
    const router = useRouter();

    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const { mutateAsync } = useDeleteEmail();

    const handleTrashIconClick = async (email: Email) => {
        if (selectedEmails.length === 0) {
            await mutateAsync({ emailIds: [email.providerMessageId], trash: true });
        }
    };

    return (
        <>
            <div className="flex h-full w-full flex-col">
                {/* Fixed Header */}
                <div className="bg-secondary sticky top-0 z-10 rounded-t-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        id="select-all"
                                        aria-label="Select all"
                                        onClick={() => {
                                            if (selectedEmails.length === data.length) {
                                                setSelectedEmails([]);
                                            } else {
                                                setSelectedEmails(data.map((email) => email._id));
                                            }
                                        }}
                                        className="cursor-pointer"
                                    />
                                </TableHead>
                                <TableHead className="w-56">From</TableHead>
                                <TableHead className="max-w-60">Subject</TableHead>
                                <TableHead className="w-28 whitespace-nowrap">Date</TableHead>
                                <TableHead className="w-14 whitespace-nowrap"></TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto">
                    <Table>
                        <tbody>
                            {data.map((email) => (
                                <TableRow
                                    key={email._id}
                                    className={`cursor-pointer ${selectedEmails.includes(email._id) ? 'bg-blue-800 hover:bg-blue-800' : ''} ${email.isRead && selectedEmails.includes(email._id) ? 'bg-blue-800 hover:bg-blue-800' : email.isRead ? 'bg-muted hover:bg-muted' : ''}`}
                                    onClick={() => {
                                        router.push(`/inbox/${email.accountId}/email/${email._id}`);
                                    }}
                                >
                                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            id={email._id}
                                            checked={selectedEmails.includes(email._id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedEmails([...selectedEmails, email._id]);
                                                } else {
                                                    setSelectedEmails(selectedEmails.filter((id) => id !== email._id));
                                                }
                                            }}
                                            className="cursor-pointer"
                                        />
                                    </TableCell>
                                    <TableCell className="w-44">{email.from.includes('no-reply') ? 'no-reply' : email.from?.split('<')[0]}</TableCell>
                                    <TableCell className="max-w-60 truncate">
                                        {email.subject} - <span className="text-muted-foreground">{email.bodyPlain}</span>
                                    </TableCell>
                                    <TableCell className="w-28 whitespace-nowrap">{formatDateToMonthDateString(email.receivedAt)}</TableCell>
                                    <TableCell className="w-10 whitespace-nowrap">
                                        <Trash
                                            className="text-red-500"
                                            size={16}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTrashIconClick(email);
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>
        </>
    );
};

export default EmailListTable;
