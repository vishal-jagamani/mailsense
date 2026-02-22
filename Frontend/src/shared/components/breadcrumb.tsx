'use client';

import Link from 'next/link';
import React from 'react';

import { useBreadcrumbStore } from '@/shared/store/breadcrumb.store';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/shared/ui/breadcrumb';

const BreadcrumbComponent: React.FC = () => {
    const { items: breadcrumbItems } = useBreadcrumbStore();
    return (
        <>
            <div className="bg-background sticky top-0 z-50 w-full p-1.5 pl-8">
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbItems.map((item, index) => (
                            <React.Fragment key={index}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={item.url}>{item.title}</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                            </React.Fragment>
                        ))}
                        {/* <BreadcrumbEllipsis /> */}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </>
    );
};

export default BreadcrumbComponent;
