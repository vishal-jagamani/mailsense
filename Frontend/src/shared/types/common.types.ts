import { LucideIcon } from 'lucide-react';

// Component Props Types
export interface DataNotFoundProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
}

export interface HomeLayoutProps {
    readonly children: React.ReactNode;
}

