import { ACCOUNT_SYNC_MODE, AccountAttributes, ProfileSettingsDataObject, UserAccountSyncSettings } from '@mailsense/types';

export interface ConnectedAccountsStatusProps {
    accounts: AccountAttributes[];
}

export interface GlobalBackgroundSyncSettingsProps {
    syncSettings: UserAccountSyncSettings;
    handleGlobalAutoSyncToggle: (value: boolean) => void;
    handleSyncModeChange: (mode: ACCOUNT_SYNC_MODE) => void;
    handleGlobalIntervalChange: (value: string) => void;
}

export interface AccountDeletionModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
}

export interface ChangePasswordModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    setShowToast: (showToast: boolean) => void;
    setToastType: (toastType: string) => void;
}

export interface UserProfileFormProps {
    formData: ProfileSettingsDataObject | null;
    setFormData: (formData: ProfileSettingsDataObject) => void;
    handleSaveButtonClick: () => void;
}
