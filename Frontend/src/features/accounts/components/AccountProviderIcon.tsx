import Image from 'next/image';

import { accountProviderIcons } from '@shared/constants';
import { AccountProviderIconProps } from '../types/accounts-components.types';

const AccountProviderIcon: React.FC<AccountProviderIconProps> = ({ provider, className }) => {
    const icon = accountProviderIcons[provider as keyof typeof accountProviderIcons];

    if (!icon) return null;

    return <Image draggable={false} src={icon} alt={provider} className={className} />;
};

export default AccountProviderIcon;
