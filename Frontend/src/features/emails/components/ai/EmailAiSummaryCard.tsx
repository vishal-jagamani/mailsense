'use client';

import { CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@shared/ui/button';
import { Skeleton } from '@shared/ui/skeleton';
import { useSummarizeThreadQuery } from '../../api/ai.queries';
import { EmailAiSummaryCardProps } from '../../types';

const EmailAiSummaryCard: React.FC<EmailAiSummaryCardProps> = ({ emailId, initialSummary, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const [hasRequested, setHasRequested] = useState<boolean>(Boolean(initialSummary));

    const {
        data: summaryData,
        isLoading,
        refetch,
        isFetching,
    } = useSummarizeThreadQuery(emailId, {
        enabled: hasRequested,
    });

    const activeSummary = summaryData?.summary || initialSummary;
    const keyPoints = summaryData?.keyPoints || [];
    const actionItems = summaryData?.actionItems || [];

    const handleTriggerSummary = () => {
        if (!hasRequested) {
            setHasRequested(true);
        } else {
            refetch();
        }
    };

    return (
        <div className={`bg-card/60 mb-4 space-y-2 rounded-xl border p-3.5 shadow-sm select-none ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="size-4 shrink-0 text-indigo-500" />
                    <p className="text-xs leading-none font-semibold">Conversation Summary</p>
                    <span className="text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 text-[10px]">Gemini 3.6 Flash</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleTriggerSummary}
                        disabled={isLoading || isFetching}
                        className="text-muted-foreground hover:text-foreground h-7 cursor-pointer px-2 text-xs"
                    >
                        <RefreshCw className={`mr-1 size-3 ${isLoading || isFetching ? 'animate-spin' : ''}`} />
                        {activeSummary ? 'Regenerate' : 'Generate'}
                    </Button>
                    {activeSummary && (
                        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="size-7 cursor-pointer">
                            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </Button>
                    )}
                </div>
            </div>

            {isLoading || isFetching ? (
                <div className="space-y-2 pt-1">
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                </div>
            ) : isExpanded && activeSummary ? (
                <div className="space-y-2.5 pt-1 text-xs">
                    <p className="text-muted-foreground leading-relaxed">{activeSummary}</p>

                    {keyPoints.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-foreground/90 font-semibold">Key Points:</p>
                            <ul className="text-muted-foreground list-inside list-disc space-y-0.5">
                                {keyPoints.map((point, idx) => (
                                    <li key={idx} className="leading-snug">
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {actionItems.length > 0 && (
                        <div className="bg-muted/30 border-border/50 space-y-1 rounded-lg border p-2">
                            <p className="text-foreground/90 font-semibold">Action Items:</p>
                            <div className="space-y-1">
                                {actionItems.map((item, idx) => (
                                    <div key={idx} className="text-muted-foreground flex items-start gap-1.5">
                                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                                        <span className="leading-snug">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default EmailAiSummaryCard;
