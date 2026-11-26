import { APP_BASE_URL } from '@config/config';
import { ROBOTS_ROUTES } from '@shared/constants';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return ROBOTS_ROUTES(APP_BASE_URL);
}
