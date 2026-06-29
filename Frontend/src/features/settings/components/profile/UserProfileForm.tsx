'use client';

import React from 'react';

import TextInput from '@shared/components/inputs/TextInput';
import { useIsMobile } from '@shared/hooks';
import { ProfileSettingsDataObject } from '@shared/types';
import { Button } from '@shared/ui/button';

interface UserProfileFormProps {
    formData: ProfileSettingsDataObject | null;
    setFormData: (formData: ProfileSettingsDataObject) => void;
    handleSaveButtonClick: () => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ formData, setFormData, handleSaveButtonClick }) => {
    const isMobile = useIsMobile();

    if (!formData) {
        return null;
    }

    return (
        <>
            <div className={`${isMobile ? 'flex-col space-y-5' : 'grid grid-cols-2'} w-full md:gap-10`}>
                <TextInput
                    type="text"
                    label="Name"
                    value={formData.name}
                    onChange={(value) => setFormData({ ...formData, name: value })}
                    className="w-full"
                />
                <TextInput
                    type="email"
                    label="Email"
                    value={formData.email}
                    onChange={(value) => setFormData({ ...formData, email: value })}
                    disabled
                    className="hover:cursor-not-allowed disabled:pointer-events-auto! disabled:hover:cursor-not-allowed"
                />
                <TextInput
                    type="tel"
                    label="Phone Number"
                    value={formData.user_metadata.phone_number}
                    onChange={(value) =>
                        setFormData({
                            ...formData,
                            user_metadata: {
                                ...formData.user_metadata,
                                phone_number: value,
                            },
                        })
                    }
                    className="w-full"
                />
            </div>
            <div className="flex">
                <Button onClick={handleSaveButtonClick} className="cursor-pointer">
                    Save Changes
                </Button>
            </div>
        </>
    );
};

export default UserProfileForm;
