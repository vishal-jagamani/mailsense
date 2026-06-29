import Image from 'next/image';
import { accountProviderIcons } from '../lib';

interface AccountProviderIconProps {
    provider: string;
    className?: string;
}

export default function AccountProviderIcon({ provider, className }: AccountProviderIconProps) {
    const icon = accountProviderIcons[provider as keyof typeof accountProviderIcons];

    if (!icon) return null;

    return <Image draggable={false} src={icon} alt={provider} className={className} />;
}
