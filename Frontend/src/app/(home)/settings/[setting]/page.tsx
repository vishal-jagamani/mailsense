import SettingsPage from '@/modules/settings';

const page = async ({ params }: { params: Promise<{ setting: string }> }) => {
    const { setting } = await params;
    return (
        <>
            <SettingsPage setting={setting} />
        </>
    );
};

export default page;
