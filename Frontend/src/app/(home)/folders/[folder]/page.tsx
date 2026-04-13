import FolderEmailList from '@/modules/folders/folderEmailList';

const page = async ({ params }: { params: { folder: string } }) => {
    const { folder } = await params;
    return (
        <>
            <FolderEmailList folderId={folder} />
        </>
    );
};

export default page;
