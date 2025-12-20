'use client';

import { Input } from '@/shared/ui/input';
import React from 'react';

interface SearchHeaderProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({ value, onChange, className }) => {
    return (
        <div className="flex w-[80%]">
            <Input value={value} onChange={(e) => onChange(e.target.value)} className={className} />
        </div>
    );
};

export default SearchHeader;
