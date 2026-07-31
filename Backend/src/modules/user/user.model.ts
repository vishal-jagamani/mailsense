import { ACCOUNT_SYNC_MODE, CreateEntityInput, UserAccountSettings, UserAccountSyncSettings, UserSettings } from '@mailsense/types';
import { Document, model, Schema } from 'mongoose';

export interface User {
    auth0UserId: string;
    name: string;
    email: string;
}

export type UserInput = CreateEntityInput<User>;

export type UserDocument = Document & User;

const UserSchema = new Schema<UserDocument>(
    {
        auth0UserId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
UserSchema.index({ auth0UserId: 1 }, { unique: true });

export const User = model<UserDocument>('User', UserSchema);

// User settings
export type UserSettingsInput = CreateEntityInput<UserSettings>;

export type UserSettingsDocument = Document & UserSettings;

const UserAccountSyncSettingsSchema = new Schema<UserAccountSyncSettings>(
    {
        globalAutoSync: { type: Boolean, default: true },
        syncMode: {
            type: String,
            enum: Object.values(ACCOUNT_SYNC_MODE),
            default: ACCOUNT_SYNC_MODE.CUSTOM_PER_ACCOUNT,
        },
        globalSyncInterval: { type: Number, default: 60 },
        defaultSyncInterval: { type: Number, default: 60 },
    },
    { _id: false },
);

const UserAccountSettingsSchema = new Schema<UserAccountSettings>(
    {
        syncSettings: { type: UserAccountSyncSettingsSchema, default: () => ({}) },
    },
    { _id: false },
);

const UserSettingsSchema = new Schema<UserSettingsDocument>(
    {
        userId: { type: String, required: true, index: true },
        account: { type: UserAccountSettingsSchema, default: () => ({}) },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
UserSettingsSchema.index({ userId: 1 }, { unique: true });

export const UserSettingsModel = model<UserSettingsDocument>('UserSettings', UserSettingsSchema);
