import { FilterQuery, ProjectionType, SortOrder } from 'mongoose';
import { Folder, FolderDocument } from './folder.model.js';

export class FolderRepository {
    public static async addFoldersInBulk(folders: Partial<FolderDocument>[]): Promise<Partial<FolderDocument>[]> {
        return await Folder.insertMany(folders);
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

    public static async createFolder(folder: Partial<FolderDocument>): Promise<FolderDocument> {
        return await Folder.create(folder);
    }

    public static async updateFolderByProviderFolderId(providerFolderId: string, folder: Partial<FolderDocument>): Promise<FolderDocument | null> {
        return await Folder.findOneAndUpdate({ providerFolderId }, folder, { new: true });
    }

    public static async deleteFolderByProviderFolderId(providerFolderId: string): Promise<void> {
        await Folder.deleteOne({ providerFolderId });
    }
}
