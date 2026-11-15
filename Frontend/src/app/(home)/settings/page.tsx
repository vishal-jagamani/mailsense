import SettingsPageWrapper from '@features/settings/pages';
import { SettingsPageParams } from '@shared/types';

const page = async ({ params }: SettingsPageParams) => {
    const { setting } = await params;
    return (
        <>
            <SettingsPageWrapper setting={setting} />
        </>
    );
};

export default page;
