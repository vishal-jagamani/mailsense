import SettingsPageWrapper from '@features/settings/pages';

const page = async ({ params }: { params: Promise<{ setting: string }> }) => {
    const { setting } = await params;
    return (
        <>
            <SettingsPageWrapper setting={setting} />
        </>
    );
};

export default page;
