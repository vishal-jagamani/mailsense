import { brotliCompressSync, brotliDecompressSync } from 'zlib';

export const compressString = (string: string): string => {
    if (!string) return '';
    return brotliCompressSync(Buffer.from(string, 'utf-8')).toString('base64');
};

export const decompressString = (compressed: string): string => {
    if (!compressed) return '';
    return brotliDecompressSync(Buffer.from(compressed, 'base64')).toString('utf-8');
};
