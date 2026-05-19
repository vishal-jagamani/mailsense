import FoldersPage from '@/modules/folders';
import React from 'react';

const page: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <FoldersPage />
        </React.Suspense>
    );
};

export default page;
