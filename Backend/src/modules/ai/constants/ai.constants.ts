export const AI_MODULE_CONSTANTS = {
    MAX_RECENT_THREAD_CONTEXT_MESSAGES: 3,
    DEFAULT_CONFIDENCE_THRESHOLD: 0.6,
} as const;

export const AI_ROUTES = {
    THREAD_SUMMARY: '/summary/:emailId',
    SUGGESTED_REPLIES: '/suggestions/:emailId',
} as const;
