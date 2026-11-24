'use client';

import { AlertCircle, ArrowDown, Flag } from 'lucide-react';
import React from 'react';

import { EMAIL_AI_PRIORITY } from '@mailsense/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';
import { PriorityFlagProps } from '../../types';

const PriorityFlag: React.FC<PriorityFlagProps> = ({ priority, className = '', showNormal = false }) => {
    if (!priority) return null;

    const normalized = String(priority).toLowerCase();

    if (normalized === EMAIL_AI_PRIORITY.CRITICAL) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={`inline-flex shrink-0 cursor-default items-center ${className}`}>
                        <AlertCircle className="size-3.5 fill-red-500/15 text-red-500" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p className="text-xs font-semibold text-red-500">Critical Priority</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (normalized === EMAIL_AI_PRIORITY.HIGH) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={`inline-flex shrink-0 cursor-default items-center ${className}`}>
                        <Flag className="size-3.5 fill-amber-500/20 text-amber-500" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p className="text-xs font-semibold text-amber-500">High Priority</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (normalized === EMAIL_AI_PRIORITY.LOW) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={`inline-flex shrink-0 cursor-default items-center opacity-60 ${className}`}>
                        <ArrowDown className="text-muted-foreground size-3" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p className="text-muted-foreground text-xs">Low Priority</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (showNormal && normalized === EMAIL_AI_PRIORITY.NORMAL) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <span className={`inline-flex shrink-0 cursor-default items-center opacity-40 ${className}`}>
                        <span className="bg-muted-foreground size-1.5 rounded-full" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p className="text-muted-foreground text-xs">Normal Priority</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return null;
};

export default PriorityFlag;
