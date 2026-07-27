import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@mailsense/types'],
};

export default nextConfig;
