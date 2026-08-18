import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { R2_CONFIG } from '@config';
import { logger } from '@utils';
import { Readable } from 'stream';

export class ObjectStorageService {
    private client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = R2_CONFIG.bucketName;
        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: R2_CONFIG.accessKeyId,
                secretAccessKey: R2_CONFIG.secretAccessKey,
            },
        });
    }

    async uploadObject(r2Key: string, body: Buffer | Readable, mimeType: string): Promise<void> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: r2Key,
                Body: body,
                ContentType: mimeType,
            });
            await this.client.send(command);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.uploadObject: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async getObjectStream(r2Key: string): Promise<{ stream: Readable; contentLength?: number }> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: r2Key,
            });
            const response = await this.client.send(command);
            return {
                stream: response.Body as Readable,
                contentLength: response.ContentLength,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.getObjectStream: ${errorMessage}`, { error: err });
            throw err;
        }
    }

    async deleteObject(r2Key: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: r2Key,
            });
            await this.client.send(command);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            logger.error(`Error in AttachmentService.deleteObject: ${errorMessage}`, { error: err });
            throw err;
        }
    }
}
