import FolderEmailListWrapper from '@features/folders/pages/folder-email-list';
import { FoldersPageParams } from '@shared/types';

const page = async ({ params }: FoldersPageParams) => {
    const { folder } = await params;
    return <FolderEmailListWrapper folderId={folder} />;
};

export default page;
