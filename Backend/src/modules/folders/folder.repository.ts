import { AnyBulkWriteOperation, FilterQuery, ProjectionType, SortOrder } from 'mongoose';
import { Folder, FolderDocument, FolderInput } from './folder.model.js';

export class FolderRepository {
    public static async upsertFoldersInBulk(folders: Partial<FolderInput>[]) {
        if (folders.length === 0) return { ok: 1 };
        const ops: AnyBulkWriteOperation[] = folders.map((folder) => ({
            updateOne: {
                filter: {
                    userId: folder.userId,
                    accountId: folder.accountId,
                    providerFolderId: folder.providerFolderId,
                },
                update: { $set: folder },
                upsert: true,
            },
        }));
        return Folder.bulkWrite(ops, { ordered: false });
    }

    public static async getAllFolders(
        filterQuery: FilterQuery<FolderDocument>,
        size: number,
        page: number,
        fields: ProjectionType<FolderDocument>,
        sort: Record<string, SortOrder>,
    ): Promise<FolderDocument[]> {
        return await Folder.find(filterQuery, fields)
            .skip((page - 1) * size)
            .limit(size)
            .sort(sort);
    }

    public static async getFolder(folderId: string): Promise<FolderDocument | null> {
        return await Folder.findById(folderId);
    }

    public static async countDocuments(filterQuery: Record<string, unknown>): Promise<number> {
        return await Folder.countDocuments(filterQuery);
    }

    public static async getAccountFolders(accountId: string): Promise<FolderDocument[]> {
        return await Folder.find({ accountId });
    }

    public static async getFolderByProviderFolderId(providerFolderId: string): Promise<FolderDocument | null> {
        return await Folder.findOne({ providerFolderId });
    }

    public static async createFolder(folder: Partial<FolderInput>): Promise<FolderDocument> {
        return await Folder.create(folder);
    }

    public static async updateFolderByProviderFolderId(providerFolderId: string, folder: Partial<FolderDocument>): Promise<FolderDocument | null> {
        return await Folder.findOneAndUpdate({ providerFolderId }, folder, { new: true });
    }

    public static async deleteFolderByProviderFolderId(providerFolderId: string): Promise<void> {
        await Folder.deleteOne({ providerFolderId });
    }
}
