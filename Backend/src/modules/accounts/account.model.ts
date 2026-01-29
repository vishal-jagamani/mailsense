import { Document, model, Schema } from 'mongoose';
import validator from 'validator';
import { AccountAttributes, AccountMetricsAttributes } from './account.types.js';

// ✅ Input type (plain object you pass into create)
export type AccountInput = Omit<AccountAttributes, 'createdAt' | 'updatedAt'>;
export type AccountMetricsInput = Omit<AccountMetricsAttributes, 'createdAt' | 'updatedAt'>;

// ✅ Document type (what comes back from Mongo)
export type AccountDocument = Document & AccountAttributes;
export type AccountMetricsDocument = Document & AccountMetricsAttributes;

const AccountSchema = new Schema<AccountDocument>(
    {
        id: { type: Number, required: true, unique: true },
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
    },
    { timestamps: true, versionKey: false },
);

// Indexes
AccountSchema.index({ emailAddress: 1 }, { unique: true });

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
        totalEmails: { type: Number, required: true },
        totalThreads: { type: Number, required: true },
        totalLabels: { type: Number, required: true },
        totalFolders: { type: Number, required: true },
        totalContacts: { type: Number, required: true },
        date: { type: Date, required: true },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
AccountMetricsSchema.index({ accountId: 1 }, { unique: true });

export const AccountMetrics = model<AccountMetricsDocument>('AccountMetrics', AccountMetricsSchema);
