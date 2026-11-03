import EmailPageWrapper from '@features/emails/pages';
import { EmailPageParams } from '@shared/types';

const page = async ({ params }: EmailPageParams) => {
    const { account, email } = await params;
    return (
        <>
            <EmailPageWrapper account={account} email={email} />
        </>
    );
};

export default page;
