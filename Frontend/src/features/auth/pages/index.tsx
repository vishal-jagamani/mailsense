'use client';

import React from 'react';

import { AuroraBackgroundDemo } from '@shared/components/AuroraBackground';
import LoginCard from '../components/LoginCard';

const IndexPage: React.FC = () => {
    return (
        <>
            <div className="flex h-screen w-screen items-center justify-center">
                <AuroraBackgroundDemo />
                <LoginCard />
            </div>
        </>
    );
};

export default IndexPage;
