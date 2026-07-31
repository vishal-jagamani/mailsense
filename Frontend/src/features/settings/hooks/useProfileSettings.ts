import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ProfileSettingsDataObject } from '@mailsense/types';
import { MESSAGES } from '@shared/constants';
import { useAuthStore } from '@shared/store';
import { useUpdateProfileMutation } from '../api/settings.mutation';
import { useGetProfileQuery } from '../api/settings.queries';

export const useProfileSettings = () => {
    const userId = useAuthStore((state) => state.user?.id);
    const [profileSettingsData, setProfileSettingsData] = useState<ProfileSettingsDataObject | null>(null);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastType, setToastType] = useState<string>('');

    const [showAccountDeletionModal, setShowAccountDeletionModal] = useState<boolean>(false);

    const { data: userProfileData, isLoading: userProfileLoading } = useGetProfileQuery(!!userId);

    const { data: updateProfileSettingsData, mutate: updateProfileSettings, isPending: updateProfileSettingsLoading } = useUpdateProfileMutation();

    useEffect(() => {
        if (userProfileData?.data) {
            setProfileSettingsData({
                nickname: userProfileData?.data.nickname ?? '',
                name: userProfileData?.data.name ?? '',
                picture: userProfileData?.data.picture ?? '',
                email: userProfileData?.data.email ?? '',
                email_verified: userProfileData?.data.email_verified ?? false,
                sub: userProfileData?.data.sub ?? '',
                user_metadata: {
                    ...userProfileData?.data?.user_metadata,
                    phone_number: (userProfileData?.data?.user_metadata as { phone_number?: string })?.phone_number ?? '',
                },
            });
        }
    }, [userProfileData]);

    const handleUserProfileSaveChangesButtonClick = () => {
        if (!profileSettingsData) {
            return;
        }
        updateProfileSettings(profileSettingsData);
    };

    useEffect(() => {
        if (updateProfileSettingsData) {
            setShowToast(true);
            setToastType('profile');
        }
    }, [updateProfileSettingsData]);

    useEffect(() => {
        if (showToast && toastType) {
            if (toastType === 'password') {
                toast.success(MESSAGES.SETTINGS.PASSWORD_UPDATE_SUCCESS, {
                    duration: 3000,
                });
            }
            if (toastType === 'profile') {
                toast.success(MESSAGES.SETTINGS.PROFILE_UPDATE_SUCCESS, {
                    duration: 3000,
                });
            }
        }
    }, [showToast, toastType]);

    useEffect(() => {
        if (showToast) {
            setTimeout(() => {
                setShowToast(false);
                setToastType('');
            }, 1000);
        }
    }, [showToast]);

    return {
        states: { profileSettingsData, showChangePasswordModal, showAccountDeletionModal },
        setters: { setProfileSettingsData, setShowChangePasswordModal, setShowAccountDeletionModal, setShowToast, setToastType },
        userProfile: { isLoading: userProfileLoading },
        updateUserProfileSettings: { isLoading: updateProfileSettingsLoading },
        actions: { handleUserProfileSaveChangesButtonClick },
    };
};
