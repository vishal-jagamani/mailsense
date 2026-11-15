'use client';

import React from 'react';

import { cn } from '@shared/utils';
import { TextInputProps } from '@shared/types';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';

const TextInput: React.FC<TextInputProps> = ({ label, value, type, onChange, disabled, className }) => {
    return (
        <>
            <div className="flex flex-col gap-2">
                <Label>{label}</Label>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={type}
                    disabled={disabled}
                    className={cn(disabled ? 'hover:cursor-not-allowed' : '', className)}
                />
            </div>
        </>
    );
};

export default TextInput;
