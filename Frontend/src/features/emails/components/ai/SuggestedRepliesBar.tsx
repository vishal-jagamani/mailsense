'use client';

import { MessageSquare, Sparkles } from 'lucide-react';
import React from 'react';

import { SUGGESTED_REPLY_TONE, SuggestedReplyItem } from '@mailsense/types';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { useSuggestedRepliesQuery } from '../../api/ai.queries';
import { SuggestedRepliesBarProps } from '../../types';

const TONE_COLORS: Record<SUGGESTED_REPLY_TONE, string> = {
    [SUGGESTED_REPLY_TONE.FORMAL]: 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
    [SUGGESTED_REPLY_TONE.CASUAL]: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    [SUGGESTED_REPLY_TONE.CONCISE]: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
};

const SuggestedRepliesBar: React.FC<SuggestedRepliesBarProps> = ({ emailId, onSelectReply, className = '' }) => {
    const { data, isLoading } = useSuggestedRepliesQuery(emailId);

    const suggestions: SuggestedReplyItem[] = data?.suggestions || [];

    if (isLoading || suggestions.length === 0) return null;

    return (
        <div className={`space-y-1.5 pt-3 pb-1 select-none ${className}`}>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Sparkles className="size-3.5 text-indigo-500" />
                <span className="font-medium">Suggested Quick Replies</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                    <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectReply(suggestion)}
                        className="hover:bg-muted/80 border-border/80 flex h-auto cursor-pointer items-start gap-2 rounded-xl px-3 py-1.5 text-xs"
                    >
                        <MessageSquare className="text-muted-foreground mt-0.5 size-3 shrink-0" />
                        <div className="space-y-0.5 text-left">
                            <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={`px-1 py-0 text-[9px] uppercase ${TONE_COLORS[suggestion.tone]}`}>
                                    {suggestion.tone}
                                </Badge>
                            </div>
                            <p className="text-foreground/90 line-clamp-1">{suggestion.body}</p>
                        </div>
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default SuggestedRepliesBar;
