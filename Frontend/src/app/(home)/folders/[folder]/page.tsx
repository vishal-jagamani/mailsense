import FolderEmailListWrapper from "@features/folders/pages/folder-email-list";

const page = async ({ params }: { params: Promise<{ folder: string }> }) => {
    const { folder } = await params;
    return <FolderEmailListWrapper folderId={folder} />;
};

export default page;
