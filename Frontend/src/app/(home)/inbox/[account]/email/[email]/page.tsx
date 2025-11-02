import EmailPage from '@/modules/emails';

const page = async ({ params }: { params: { account: string; email: string } }) => {
    const { account, email } = await params;
    return (
        <>
            <EmailPage account={account} email={email} />
        </>
    );
};

export default page;
