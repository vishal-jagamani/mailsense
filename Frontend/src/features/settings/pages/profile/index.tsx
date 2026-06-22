'use client';

import React from 'react';

import AccountDeletionModal from '@features/settings/components/profile/AccountDeletionModal';
import ChangePasswordModal from '@features/settings/components/profile/ChangePasswordModal';
import UserProfileForm from '@features/settings/components/profile/UserProfileForm';
import { useProfileSettings } from '@features/settings/hooks';
import APILoader from '@shared/components/apiLoader';
import Loader from '@shared/components/loader';
import { Button } from '@shared/ui/button';
import { Label } from '@shared/ui/label';
import { Separator } from '@shared/ui/separator';

const ProfileSettings: React.FC = () => {
    const {
        states: { profileSettingsData, showAccountDeletionModal, showChangePasswordModal },
        setters: { setProfileSettingsData, setShowAccountDeletionModal, setShowChangePasswordModal, setShowToast, setToastType },
        userProfile: { isLoading: userProfileLoading },
        updateUserProfileSettings: { isLoading: updateProfileSettingsLoading },
        actions: { handleUserProfileSaveChangesButtonClick },
    } = useProfileSettings();

    if (userProfileLoading || !profileSettingsData) {
        return <Loader />;
    }

    return (
        <>
            <div className="bg-sidebar relative flex w-full flex-col gap-6 rounded-md border p-4">
                <APILoader show={updateProfileSettingsLoading} size="small" />
                <UserProfileForm
                    formData={profileSettingsData}
                    setFormData={setProfileSettingsData}
                    handleSaveButtonClick={handleUserProfileSaveChangesButtonClick}
                />
                <Separator />
                <div className="flex flex-col gap-2">
                    <Label className="text-md">Password</Label>
                    <Button variant="outline" className="w-44 cursor-pointer" onClick={() => setShowChangePasswordModal(true)}>
                        Change My Password
                    </Button>
                </div>
                {showChangePasswordModal && (
                    <ChangePasswordModal
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
