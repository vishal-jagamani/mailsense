import EmailPageWrapper from '@features/emails/pages';

const page = async ({ params }: { params: { account: string; email: string } }) => {
    const { account, email } = await params;
    return (
        <>
            <EmailPageWrapper account={account} email={email} />
        </>
    );
};

export default page;
