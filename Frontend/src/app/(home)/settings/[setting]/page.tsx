import SettingsPage from '@features/settings/pages';

const page = async ({ params }: { params: Promise<{ setting: string }> }) => {
    const { setting } = await params;
    return (
        <>
            <SettingsPage setting={setting} />
        </>
    );
};

export default page;
