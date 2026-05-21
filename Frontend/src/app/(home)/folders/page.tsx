import React from 'react';

import FoldersPage from '@modules/folders';

const page: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <FoldersPage />
        </React.Suspense>
    );
};

export default page;
