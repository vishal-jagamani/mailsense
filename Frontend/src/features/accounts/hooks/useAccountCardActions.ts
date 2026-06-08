import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AccountAttributes } from '@entities/account';
import { UI_CONSTANTS } from '@shared/constants';
import { useEnableAccountMutation, useRemoveAccountMutation, useSyncAccountMutation } from '../api/accounts.mutations';

export const useAccountCardActions = (account: AccountAttributes) => {
    const [accountEnabled, setAccountEnabled] = useState(account.active);

    const { mutateAsync: removeAccount, isPending: isRemovingAccount, error: removeAccountError } = useRemoveAccountMutation();
    const { mutateAsync: syncAccount, isPending: isSyncingAccount, error: syncAccountError } = useSyncAccountMutation();
    const { mutate: enableAccount, isPending: isEnablingAccount, data: enableAccountData, error: enableAccountError } = useEnableAccountMutation();

    useEffect(() => {
        setAccountEnabled(account.active);
    }, [account.active]);

    useEffect(() => {
        if (enableAccountData) {
            toast.success(enableAccountData.message, { duration: UI_CONSTANTS.TOAST.DURATION });
        }

        if (enableAccountError) {
            toast.error(enableAccountError.message, { duration: UI_CONSTANTS.TOAST.DURATION });
            setAccountEnabled(account.active);
        }
    }, [account.active, enableAccountData, enableAccountError]);

    const toggleAccountEnabled = (active: boolean) => {
        setAccountEnabled(active);
        enableAccount({ accountId: account._id, active });
    };

    const syncCurrentAccount = async () => {
        await syncAccount(account._id);
    };

    const removeCurrentAccount = async () => {
        await removeAccount(account._id);
    };

    return {
        accountEnabled,
        toggleAccountEnabled,
        syncCurrentAccount,
        removeCurrentAccount,
        isEnablingAccount,
        isSyncingAccount,
        isRemovingAccount,
        enableAccountError,
        syncAccountError,
        removeAccountError,
    };
};
