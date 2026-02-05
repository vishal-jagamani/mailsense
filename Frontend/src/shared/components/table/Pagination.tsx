'use client';

import { EMAILS_PAGE_SIZE } from '@/shared/constants';
import { Field, FieldLabel } from '@/shared/ui/field';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/shared/ui/pagination';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import React, { useEffect, useState } from 'react';

interface PaginationProps {
    total: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSize?: number;
}

const PaginationComponent: React.FC<PaginationProps> = ({ total, currentPage, onPageChange, onPageSizeChange, pageSize = EMAILS_PAGE_SIZE }) => {
    const totalPages: number = Math.ceil(total / pageSize);
    const [pagesToShow, setPagesToShow] = useState<number[]>([]);
    const [localPageSize, setLocalPageSize] = useState(pageSize);

    useEffect(() => {
        setLocalPageSize(pageSize);
    }, [pageSize]);

    useEffect(() => {
        let pages: number[] = [];

        if (totalPages <= 5) {
            pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            if (currentPage <= 3) {
                pages = [1, 2, 3, 4, 5];
            } else if (currentPage >= totalPages - 2) {
                pages = Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
            } else {
                pages = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
            }
            if (currentPage > 3 && currentPage < totalPages - 2) {
                pages.unshift(1);
                if (!pages.includes(totalPages)) {
                    pages.push(totalPages);
                }
            } else if (currentPage <= 3) {
                if (!pages.includes(totalPages)) {
                    pages.push(totalPages);
                }
            }
        }
        setPagesToShow(pages);
    }, [currentPage, totalPages]);

    const handlePageSizeChange = (newSize: string) => {
        const size = parseInt(newSize, 10);
        setLocalPageSize(size);
        onPageSizeChange?.(size);
    };
    return (
        <>
            <div className="flex w-full justify-end">
                <div className="flex">
                    <Pagination className="select-none">
                        <PaginationContent>
                            <PaginationItem className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''} cursor-pointer`}>
                                <PaginationPrevious
                                    onClick={() => {
                                        if (currentPage > 1) {
                                            onPageChange(currentPage - 1);
                                        }
                                    }}
                                />
                            </PaginationItem>
                            {pagesToShow.map((page, index) => (
                                <React.Fragment key={page}>
                                    {/* Show ellipsis at start only if page 1 is not visible */}
                                    {index === 0 && page !== 1 && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}
                                    <PaginationItem>
                                        <PaginationLink onClick={() => onPageChange(page)} isActive={currentPage === page} className="cursor-pointer">
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                    {/* Show ellipsis between non-consecutive pages */}
                                    {index < pagesToShow.length - 1 && pagesToShow[index + 1] !== page + 1 && (
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    )}
                                </React.Fragment>
                            ))}
                            <PaginationItem className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} cursor-pointer`}>
                                <PaginationNext
                                    onClick={() => {
                                        if (currentPage < totalPages) {
                                            onPageChange(currentPage + 1);
                                        }
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                    <Field orientation="horizontal" className="w-fit">
                        <FieldLabel htmlFor="select-rows-per-page" className="text-nowrap">
                            Rows per page
                        </FieldLabel>
                        <Select defaultValue={localPageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-20" id="select-rows-per-page">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                                <SelectGroup>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </div>
        </>
    );
};

export default PaginationComponent;
