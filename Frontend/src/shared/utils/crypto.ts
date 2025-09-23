import crypto from 'crypto';
import { CRYPTO } from '../constants';
import { ENCRYPTION_KEY } from '@/config/config';

const cryptoKey = Buffer.from(ENCRYPTION_KEY, 'base64');

if (cryptoKey.length !== 32) {
    throw new Error('❌ ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
}

// Encrypt data
export const encrypt = (data: string) => {
    try {
        const iv = crypto.randomBytes(CRYPTO.IV_LENGTH);

        const cipher = crypto.createCipheriv(CRYPTO.ALGORITHM, cryptoKey, iv, {
            authTagLength: CRYPTO.TAG_LENGTH,
        } as crypto.CipherCCMOptions) as crypto.CipherCCM;

        const encryptedData = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return Buffer.concat([iv, authTag, encryptedData]).toString('base64');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error in encrypt: ${errorMessage}`);
    }
};

// Decrypt data
export const decrypt = (encryptedData: string) => {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');

        const iv = buffer.subarray(0, CRYPTO.IV_LENGTH);
        const authTag = buffer.subarray(CRYPTO.IV_LENGTH, CRYPTO.IV_LENGTH + CRYPTO.TAG_LENGTH);
        const encrypted = buffer.subarray(CRYPTO.IV_LENGTH + CRYPTO.TAG_LENGTH);

        const decipher = crypto.createDecipheriv(CRYPTO.ALGORITHM, cryptoKey, iv, {
            authTagLength: CRYPTO.TAG_LENGTH,
        } as crypto.CipherCCMOptions) as crypto.DecipherCCM;
        decipher.setAuthTag(authTag);

        const decryptedData = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf-8');
        return decryptedData;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        throw new Error(`Error in decrypt: ${errorMessage}`);
    }
};
