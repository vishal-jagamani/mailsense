'use client';

import React from 'react';

import { SearchHeaderProps } from '@shared/types';
import { Input } from '@shared/ui/input';

const SearchHeader: React.FC<SearchHeaderProps> = ({ value, onChange, className, placeholder }) => {
    return (
        <div className="flex w-full">
            <Input
                id="email-search-input"
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
                placeholder={placeholder}
            />
        </div>
    );
};

export default SearchHeader;
