import { Metadata, MetadataRoute } from 'next';

export const LAYOUT_METADATA = (siteUrl: string): Metadata => {
    return {
        metadataBase: new URL(siteUrl),
        title: {
            default: 'MailSense — Unified AI-Powered Email Client',
            template: '%s | MailSense',
        },
        description:
            'Open-source unified inbox connecting Gmail and Microsoft Outlook with privacy-first Gemini AI categorization, priority scoring, summaries, and quick replies.',
        keywords: ['unified inbox', 'email client', 'open source email', 'AI email assistant', 'Gmail', 'Outlook', 'MailSense'],
        authors: [{ name: 'MailSense Open Source Contributors' }],
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: siteUrl,
            siteName: 'MailSense',
            title: 'MailSense — Unified AI-Powered Email Client',
            description:
                'Connect Gmail & Outlook in one fast, open-source workspace with smart AI categorization, priority scoring, and thread summaries.',
        },
        twitter: {
            card: 'summary_large_image',
            title: 'MailSense — Unified AI-Powered Email Client',
            description: 'Open-source unified inbox for Gmail & Outlook powered by privacy-first Gemini AI.',
        },
        robots: {
            index: true,
            follow: true,
        },
    };
};

export const ROBOTS_ROUTES = (baseUrl: string): MetadataRoute.Robots => {
    return {
        rules: {
            userAgent: '*',
            allow: ['/get_started', '/privacy', '/terms'],
            disallow: ['/inbox', '/drafts', '/folders', '/accounts', '/settings', '/starred', '/api'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
};

export const METADATA_SITEMAP = (baseUrl: string): MetadataRoute.Sitemap => {
    const lastModified = new Date('2026-11-26');

    return [
        {
            url: `${baseUrl}/get_started`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];
};
