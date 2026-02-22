export const EMAIL_API_URLS = {
    LIST: '/emails/list',
    DELETE: '/emails',
    DETAILS: (emailId: string) => `/emails/details/${emailId}`,
    ARCHIVE: '/emails/archive',
    STAR: '/emails/star',
    UNREAD: '/emails/unread',
    SEARCH: '/emails/search',
} as const;
