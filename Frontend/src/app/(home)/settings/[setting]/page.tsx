import SettingsPage from '@features/settings/pages';
import { SettingsPageParams } from '@shared/types';

const page = async ({ params }: SettingsPageParams) => {
    const { setting } = await params;
    return (
        <>
            <SettingsPage setting={setting} />
        </>
    );
};

export default page;
