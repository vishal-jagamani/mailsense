import { brotliCompressSync, brotliDecompressSync } from 'zlib';

export const compressString = (string: string): string => {
    return brotliCompressSync(Buffer.from(string, 'utf-8')).toString('base64');
};

export const decompressString = (compressed: string): string => {
    return brotliDecompressSync(Buffer.from(compressed, 'base64')).toString('utf-8');
};
