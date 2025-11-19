'use client';

import APILoader from '@/shared/components/apiLoader';
import TextInput from '@/shared/components/inputs/TextInput';
import Loader from '@/shared/components/loader';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { useAuthStore } from '@/store';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useGetUserProfileSettings, useUpdateUserProfileSettings } from '../../services/useSettingsApi';
import { ProfileSettingsDataObject } from '../../settings.types';
import AccountDeletionModal from './AccountDeletionModal';
import ChangePassword from './ChangePassword';

const ProfileSettings: React.FC = () => {
    const userId = useAuthStore((state) => state.user?.id);
    const [profileSettingsData, setProfileSettingsData] = useState<ProfileSettingsDataObject | null>(null);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastType, setToastType] = useState<string>('');

    const [showAccountDeletionModal, setShowAccountDeletionModal] = useState<boolean>(false);

    const { data: userProfileData, isLoading: userProfileLoading } = useGetUserProfileSettings(userId || '', !!userId);

    const {
        data: updateProfileSettingsData,
        mutate: updateProfileSettings,
        isPending: updateProfileSettingsLoading,
    } = useUpdateUserProfileSettings();

    useEffect(() => {
        if (userProfileData?.data) {
            setProfileSettingsData({
                nickname: userProfileData?.data.nickname,
                name: userProfileData?.data.name,
                picture: userProfileData?.data.picture,
                email: userProfileData?.data.email,
                email_verified: userProfileData?.data.email_verified,
                sub: userProfileData?.data.sub,
                user_metadata: userProfileData?.data?.user_metadata,
            });
        }
    }, [userProfileData]);

    const handleUserProfileSaveChangesButtonClick = () => {
        if (!profileSettingsData) {
            return;
        }
        updateProfileSettings({ userId: userId || '', data: profileSettingsData });
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
                toast.success('Password updated successfully', {
                    duration: 3000,
                });
            }
            if (toastType === 'profile') {
                toast.success('Profile updated successfully', {
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

    if (userProfileLoading || !profileSettingsData) {
        return <Loader />;
    }

    return (
        <>
            <div className="bg-sidebar relative flex w-full flex-col gap-6 rounded-md border p-4">
                <APILoader show={updateProfileSettingsLoading} size="small" />
                <div className="grid w-4/5 grid-cols-2 gap-10">
                    <TextInput
                        type="text"
                        label="Name"
                        value={profileSettingsData?.name || ''}
                        onChange={(value) => setProfileSettingsData({ ...profileSettingsData, name: value })}
                    />
                    <TextInput
                        type="email"
                        label="Email"
                        value={profileSettingsData.email}
                        onChange={(value) => setProfileSettingsData({ ...profileSettingsData, email: value })}
                        disabled
                        className="hover:cursor-not-allowed disabled:pointer-events-auto! disabled:hover:cursor-not-allowed"
                    />
                    <TextInput
                        type="tel"
                        label="Phone Number"
                        value={profileSettingsData?.user_metadata?.phone_number}
                        onChange={(value) =>
                            setProfileSettingsData({
                                ...profileSettingsData,
                                user_metadata: {
                                    ...(profileSettingsData.user_metadata || {}),
                                    phone_number: value,
                                },
                            })
                        }
                    />
                </div>
                <div className="flex">
                    <Button onClick={handleUserProfileSaveChangesButtonClick} className="cursor-pointer">
                        Save Changes
                    </Button>
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                    <Label className="text-md">Password</Label>
                    <Button variant="outline" className="w-44 cursor-pointer" onClick={() => setShowChangePasswordModal(true)}>
                        Change My Password
                    </Button>
                </div>
                {showChangePasswordModal && (
                    <ChangePassword
                        show={showChangePasswordModal}
                        setShow={setShowChangePasswordModal}
                        setShowToast={setShowToast}
                        setToastType={setToastType}
                    />
                )}
                <Separator />
                <div className="flex flex-col gap-2">
                    <Label className="text-md">Account</Label>
                    <Button variant="destructive" className="w-44 cursor-pointer" onClick={() => setShowAccountDeletionModal(true)}>
                        Delete Account
                    </Button>
                    <AccountDeletionModal show={showAccountDeletionModal} setShow={setShowAccountDeletionModal} />
                </div>
            </div>
        </>
    );
};

export default ProfileSettings;
