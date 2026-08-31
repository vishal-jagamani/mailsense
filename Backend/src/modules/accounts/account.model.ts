import { ACCOUNT_LAST_SYNC_STATUS, AccountAttributes, AccountMetricsAttributes, CreateEntityInput } from '@mailsense/types';
import { Document, model, Schema } from 'mongoose';
import validator from 'validator';

// ✅ Input type (plain object you pass into create)
export type AccountInput = CreateEntityInput<AccountAttributes>;
export type AccountMetricsInput = CreateEntityInput<AccountMetricsAttributes>;

// ✅ Document type (what comes back from Mongo)
export type AccountDocument = Document & AccountAttributes;
export type AccountMetricsDocument = Document & AccountMetricsAttributes;

const AccountSchema = new Schema<AccountDocument>(
    {
        userId: { type: String, required: true },
        provider: { type: String, required: true },
        emailAddress: { type: String, required: true },
        userProfileDetails: { type: Object, required: true },
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        accessTokenExpiry: { type: Number, required: true },
        refreshTokenExpiry: { type: Number, required: true },
        scope: { type: String, required: true },
        syncEnabled: { type: Boolean, required: true },
        syncInterval: { type: Number, required: true },
        lastSyncedAt: { type: Number, required: true },
        lastSyncCursor: { type: String, required: false },
        active: { type: Boolean, required: true },
        syncInProgress: { type: Boolean, required: true },
        lastSyncStatus: { type: String, enum: Object.values(ACCOUNT_LAST_SYNC_STATUS), required: false },
        lastSyncError: { type: String, required: false },
        lastSyncStartedAt: { type: Number, required: false },
        lastSyncCompletedAt: { type: Number, required: false },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
AccountSchema.index({ emailAddress: 1 }, { unique: true });
AccountSchema.index({ userId: 1 });
AccountSchema.index({ active: 1 });

// ✅ Pre-save hook
AccountSchema.pre('save', function (next) {
    if (this.emailAddress) {
        this.emailAddress = this.emailAddress.trim().toLowerCase();
    }
    if (!validator.isEmail(this.emailAddress)) {
        return next(new Error('Invalid email format'));
    }
    next();
});

export const Account = model<AccountDocument>('Account', AccountSchema);

const AccountMetricsSchema = new Schema<AccountMetricsDocument>(
    {
        accountId: { type: String, required: true },
        totalEmails: { type: Number, required: true, default: 0 },
        totalThreads: { type: Number, required: true, default: 0 },
        totalLabels: { type: Number, required: true, default: 0 },
        totalFolders: { type: Number, required: true, default: 0 },
        totalContacts: { type: Number, required: true, default: 0 },
        unreadCount: { type: Number, required: false, default: 0 },
        sentCount: { type: Number, required: false, default: 0 },
        date: { type: Date, required: true, default: Date.now },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
AccountMetricsSchema.index({ accountId: 1 }, { unique: true });

export const AccountMetrics = model<AccountMetricsDocument>('AccountMetrics', AccountMetricsSchema);
