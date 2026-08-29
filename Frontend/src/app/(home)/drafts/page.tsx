import React from 'react';
import DraftsPageWrapper from '@features/drafts/pages';

const DraftsRoutePage: React.FC = () => {
    return (
        <React.Suspense fallback={null}>
            <DraftsPageWrapper />
        </React.Suspense>
    );
};

export default DraftsRoutePage;
