'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useBreadcrumbStore } from '../constants/store/breadcrumb.store';

export const useResetBreadcrumb = () => {
    const pathName = usePathname();
    useEffect(() => {
        useBreadcrumbStore.setState({ items: [] });
    }, [pathName]);
};
