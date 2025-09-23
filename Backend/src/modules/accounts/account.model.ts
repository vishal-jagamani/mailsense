import { model, Schema } from 'mongoose';
import validator from 'validator';

export interface AccountAttributes {
    id: number;
    userId: string;
    provider: string;
    emailAddress: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    scope: string;
    syncEnabled: boolean;
    syncInterval: number;
    lastSyncedAt: number;
}

// ✅ Input type (plain object you pass into create)
export type AccountInput = Omit<AccountAttributes, 'createdAt' | 'updatedAt'>;
// export type AccountInput = AccountAttributes;

// ✅ Document type (what comes back from Mongo)
export type AccountDocument = Document & AccountAttributes;

const AccountSchema = new Schema<AccountDocument>(
    {
        id: { type: Number, required: true, unique: true },
        userId: { type: String, required: true },
        provider: { type: String, required: true },
        emailAddress: { type: String, required: true, unique: true },
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        accessTokenExpiry: { type: Number, required: true },
        refreshTokenExpiry: { type: Number, required: true },
        scope: { type: String, required: true },
        syncEnabled: { type: Boolean, required: true },
        syncInterval: { type: Number, required: true },
        lastSyncedAt: { type: Number, required: true },
    },
    { timestamps: true, versionKey: false },
);

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
