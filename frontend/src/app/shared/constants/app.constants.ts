/**
 * Application constants
 */

export const APP_CONSTANTS = {
    ROUTES: {
        HOME: '/home',
        PROFILE: '/profile',
        NETWORK: '/network',
        NOTIFICATIONS: '/notifications',
        SETTINGS: '/settings',
        DASHBOARD: '/dashboard',
        LOGIN: '/login',
        REGISTER: '/register'
    },

    DEFAULTS: {
        AVATAR: 'assets/default-avatar.png',
        READ_TIME: '5 min read',
        ROLE: 'User',
        BIO: 'Welcome to my blog!'
    },

    PAGINATION: {
        PAGE_SIZE: 10,
        MAX_BADGE_COUNT: 99
    },

    VALIDATION: {
        MIN_SEARCH_LENGTH: 2,
        MAX_SEARCH_RESULTS: 10,
        DEBOUNCE_TIME: 400
    }
} as const;

export const NOTIFICATION_TYPES = {
    LIKE: 'LIKE',
    COMMENT: 'COMMENT',
    FOLLOW: 'FOLLOW',
    NEW_POST: 'NEW_POST',
    SYSTEM: 'SYSTEM'
} as const;

export const FILTER_OPTIONS = {
    ALL: 'all',
    POSTS: 'posts',
    PEOPLE: 'people'
} as const;

export const STATUS_FILTERS = {
    ALL: 'all',
    ACTIVE: 'active',
    BANNED: 'banned',
    ADMINS: 'admins'
} as const;
