'use client';

import React from 'react';

const Loader: React.FC = () => {
    return (
        <>
            <div className="flex h-full w-full items-center justify-center">
                <div className="flex min-h-screen items-center justify-center">
                    <div className="relative">
                        <div className="relative h-24 w-24">
                            <div
                                className="absolute h-full w-full animate-spin rounded-full border-[3px] border-gray-100/10 border-r-[#0ff] border-b-[#0ff]"
                                style={{ animationDuration: '2s' }}
                            ></div>

                            <div
                                className="absolute h-full w-full animate-spin rounded-full border-[3px] border-gray-100/10 border-t-[#0ff]"
                                style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                            ></div>
                        </div>

                        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-tr from-[#0ff]/10 via-transparent to-[#0ff]/5 blur-sm"></div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Loader;
