import { Button } from '@shared/ui/button';
import { RefreshCw } from 'lucide-react';
import React from 'react';
import { DashboardHeaderActionBarProps } from '../../types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/ui/tooltip';

const DashboardHeaderActionBar: React.FC<DashboardHeaderActionBarProps> = ({
    timeframeOptions,
    selectedTimeframe,
    onSelectAccountId,
    handleRefreshClick,
    isRefreshing,
}) => {
    return (
        <>
            <div className="flex w-full items-center justify-between gap-1 md:gap-2">
                {/* Timeframe Filter Pills */}
                <div className="border-border/80 bg-muted/40 rounded-lg border p-0.5">
                    {timeframeOptions.map((option) => {
                        const isSelected = selectedTimeframe === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onSelectAccountId(option.value)}
                                className={`cursor-pointer rounded-md px-2 py-2 text-xs font-medium text-nowrap transition-all ${
                                    isSelected
                                        ? 'bg-secondary text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-card/40 hover:text-foreground'
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {/* Manual Refresh Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefreshClick}
                            disabled={isRefreshing}
                            className="border-border/80 bg-card/60 h-9 w-9 cursor-pointer backdrop-blur-sm"
                            title="Refresh analytics data"
                        >
                            <RefreshCw className={`text-muted-foreground h-3.5 w-3.5 ${isRefreshing ? 'text-primary animate-spin' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-md font-semibold">Refresh analytics data</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </>
    );
};

export default DashboardHeaderActionBar;
