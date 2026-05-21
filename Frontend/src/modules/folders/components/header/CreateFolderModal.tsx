'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import gmailIcon from '@assets/icons/gmail/icons8-gmail-96.png';
import outlookIcon from '@assets/icons/outlook/icons8-outlook-96.svg';
import APILoader from '@shared/components/apiLoader';
import { MESSAGES, UI_CONSTANTS } from '@shared/constants';
import { AccountAttributes, CreateFolderBodyParams } from '@shared/types';
import { AlertDialogFooter, AlertDialogHeader } from '@shared/ui/alert-dialog';
import { Button } from '@shared/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@shared/ui/dialog';
import { Field, FieldGroup } from '@shared/ui/field';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { useCreateFolderMutation } from '../../services/useFolderApi';

const iconMapping = [
    { name: 'outlook', icon: outlookIcon },
    { name: 'gmail', icon: gmailIcon },
];

interface CreateFolderModalProps {
    accounts: AccountAttributes[];
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ accounts }) => {
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [createFolderBody, setCreateFolderBody] = useState<CreateFolderBodyParams>({ accountId: '', folderName: '' });

    const { mutate: createFolder, data: createFolderData, isPending: isCreatingFolder, error: createFolderError } = useCreateFolderMutation();

    useEffect(() => {
        if (createFolderData) {
            toast.success(MESSAGES.FOLDERS.CREATE_FOLDERS_SUCCESS, { duration: UI_CONSTANTS.TOAST.DURATION });
            setModalOpen(false);
            setCreateFolderBody({ accountId: '', folderName: '' });
        }
        if (createFolderError) {
            toast.error(MESSAGES.FOLDERS.CREATE_FOLDER_ERROR, { duration: UI_CONSTANTS.TOAST.DURATION });
        }
    }, [createFolderData, createFolderError]);

    const handleCreateFolderButtonClick = () => {
        createFolder(createFolderBody);
    };

    return (
        <>
            <Dialog open={modalOpen}>
                <form>
                    <DialogTrigger asChild onClick={() => setModalOpen(true)}>
                        <Button variant="default" className="cursor-pointer px-6">
                            Create
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-sm" onPointerDownOutside={(e) => e.preventDefault()} showCloseButton={false}>
                        <APILoader show={isCreatingFolder} size="xs" />
                        <AlertDialogHeader>
                            <DialogTitle>Create Folder</DialogTitle>
                        </AlertDialogHeader>
                        <FieldGroup>
                            <Field>
                                <Label htmlFor="name-1">Name</Label>
                                <Input
                                    id="name-1"
                                    name="name"
                                    value={createFolderBody.folderName}
                                    onChange={(e) => setCreateFolderBody((prev) => ({ ...prev, folderName: e.target.value }))}
                                />
                            </Field>
                            <Field>
                                <div className="flex w-full flex-col gap-3">
                                    <Label htmlFor="username-1">Account</Label>
                                    <Select
                                        value={createFolderBody.accountId}
                                        onValueChange={(value) => setCreateFolderBody((prev) => ({ ...prev, accountId: value }))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select account" />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {accounts &&
                                                accounts?.map((item, index) => {
                                                    return (
                                                        <SelectItem key={index + 1} value={item?._id} className="text-xs">
                                                            <Image
                                                                draggable={false}
                                                                src={iconMapping?.find((val) => val.name === item.provider)?.icon}
                                                                alt={item.provider}
                                                                className="size-4"
                                                            />
                                                            {item?.emailAddress}
                                                        </SelectItem>
                                                    );
                                                })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </Field>
                        </FieldGroup>
                        <AlertDialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setModalOpen(false);
                                        setCreateFolderBody({ accountId: '', folderName: '' });
                                    }}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                onClick={handleCreateFolderButtonClick}
                                disabled={!createFolderBody.accountId || !createFolderBody.folderName}
                            >
                                Save changes
                            </Button>
                        </AlertDialogFooter>
                    </DialogContent>
                </form>
            </Dialog>
        </>
    );
};

export default CreateFolderModal;
