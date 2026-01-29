'use client';

import { Input } from '@/shared/ui/input';
import React from 'react';

interface SearchHeaderProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ value, onChange, className, placeholder }) => {
    return (
        <div className="flex w-full">
            <Input value={value} onChange={(e) => onChange(e.target.value)} className={className} placeholder={placeholder} />
        </div>
    );
};

export default SearchHeader;
