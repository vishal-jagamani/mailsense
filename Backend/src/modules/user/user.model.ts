import { Document, model, Schema } from 'mongoose';

export interface User {
    auth0UserId: string;
    name: string;
    email: string;
    userMetaData: {
        [key: string]: string;
    };
}

export type UserInput = Omit<User, 'createdAt' | 'updatedAt'>;

export type UserDocument = Document & User;

const UserSchema = new Schema<UserDocument>(
    {
        auth0UserId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        userMetaData: { type: Object, required: true },
    },
    { timestamps: true, versionKey: false },
);

// Indexes
UserSchema.index({ auth0UserId: 1 }, { unique: true });

export const User = model<UserDocument>('User', UserSchema);
