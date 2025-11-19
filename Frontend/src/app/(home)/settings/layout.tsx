export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <div className="m-4 mt-8 flex flex-col gap-2 rounded-2xl p-2">{children}</div>
        </>
    );
}
