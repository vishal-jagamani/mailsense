'use client';

import Link from 'next/link';
import React from 'react';

import { useBreadcrumbStore } from '@shared/store';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@shared/ui/breadcrumb';
import { SidebarTrigger } from '@shared/ui/sidebar';

const BreadcrumbComponent: React.FC = () => {
    const { items: breadcrumbItems } = useBreadcrumbStore();

    return (
        <div className="bg-background sticky top-0 z-40 flex h-10 w-full shrink-0 items-center gap-1 px-1">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground ml-1" />
            <Breadcrumb className="min-w-0 flex-1">
                <BreadcrumbList className="flex-nowrap overflow-hidden">
                    {breadcrumbItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <BreadcrumbItem className="shrink-0 truncate">
                                <BreadcrumbLink asChild>
                                    <Link href={item.url} className="truncate text-xs">
                                        {item.title}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator className="shrink-0" />}
                        </React.Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
};

export default BreadcrumbComponent;
