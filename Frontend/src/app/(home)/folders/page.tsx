import React from 'react';

import FoldersPageWrapper from '@features/folders/pages';

const page: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <FoldersPageWrapper />
        </React.Suspense>
    );
};

export default page;
