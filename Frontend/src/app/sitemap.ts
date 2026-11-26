import { APP_BASE_URL } from '@config/config';
import { METADATA_SITEMAP } from '@shared/constants';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return METADATA_SITEMAP(APP_BASE_URL);
}
