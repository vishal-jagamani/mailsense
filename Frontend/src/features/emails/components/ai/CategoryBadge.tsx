'use client';

import React from 'react';

import { CATEGORY_STYLES } from '@shared/constants';
import { CategoryBadgeProps } from '../../types';

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
    if (!category) return null;

    const normalizedCategory = String(category).toLowerCase();
    const style = CATEGORY_STYLES[normalizedCategory] ?? {
        label: category,
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200',
    };

    return (
        <span
            className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-[10px] leading-none font-medium ${style.className} ${className}`}
        >
            {style.label}
        </span>
    );
};

export default CategoryBadge;
