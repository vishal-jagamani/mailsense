import {
    ACCOUNT_SYNC_MODE,
    CreateEntityInput,
    UserAccountSettings,
    UserAccountSyncSettings,
    UserAIFeatureSettings,
    UserAISettings,
    UserSettings,
} from '@mailsense/types';
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

const UserAIFeatureSettingsSchema = new Schema<UserAIFeatureSettings>(
    {
        categorization: { type: Boolean, default: true },
        priorityScoring: { type: Boolean, default: true },
        summarization: { type: Boolean, default: true },
        suggestedReplies: { type: Boolean, default: true },
    },
    { _id: false },
);

const UserAISettingsSchema = new Schema<UserAISettings>(
    {
        enabled: { type: Boolean, default: true },
        features: { type: UserAIFeatureSettingsSchema, default: () => ({}) },
        disabledAccountIds: { type: [String], default: [] },
        consentGivenAt: { type: Date, default: () => new Date() },
    },
    { _id: false },
);

const UserSettingsSchema = new Schema<UserSettingsDocument>(
    {
        userId: { type: String, required: true },
        account: { type: UserAccountSettingsSchema, default: () => ({}) },
        ai: { type: UserAISettingsSchema, default: () => ({}) },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
UserSettingsSchema.index({ userId: 1 }, { unique: true });

export const UserSettingsModel = model<UserSettingsDocument>('UserSettings', UserSettingsSchema);
