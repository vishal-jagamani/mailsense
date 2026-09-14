import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@mailsense/types'],
};

export default withSentryConfig(nextConfig, {
    silent: true,
    telemetry: false,
});
