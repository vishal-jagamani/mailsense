'use client';

import React from 'react';

interface APILoaderProps {
    show: boolean;
    size?: 'xs' | 'small' | 'medium' | 'large';
}

const APILoader = ({ show, size = 'small' }: APILoaderProps) => {
    if (!show) {
        return null;
    }
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
            <div className={`relative ${size === 'xs' ? 'h-6 w-6' : size === 'small' ? 'h-10 w-10' : size === 'medium' ? 'h-16 w-16' : 'h-20 w-20'}`}>
                <div
                    className="absolute h-full w-full animate-spin rounded-full border-[3px] border-gray-100/10 border-r-[#0ff] border-b-[#0ff]"
                    style={{ animationDuration: '2s' }}
                ></div>
                <div
                    className="absolute h-full w-full animate-spin rounded-full border-[3px] border-gray-100/10 border-t-[#0ff]"
                    style={{ animationDuration: '2s', animationDirection: 'reverse' }}
                ></div>
            </div>
        </div>
    );
};

export default APILoader;
