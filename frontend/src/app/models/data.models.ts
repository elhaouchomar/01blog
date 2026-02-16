export interface User {
    id: number;
    name: string;
    handle: string;
    avatar: string;
    role?: string;
    stats?: {
        posts: number;
        followers: number;
        following: number;
        viewers?: number;
        impressions?: string;
    };
    location?: string;
    isOnline?: boolean;
    isAdmin?: boolean;
    username?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    password?: string;
    cover?: string;
    bio?: string;
    createdAt?: string;
    isSubscribed?: boolean;
    subscribed?: boolean; // From backend
    isFollowing?: boolean;
    followersCount?: number;
    followingCount?: number;
    banned?: boolean;
}

// Backend DTO structure
export interface UserSummaryDTO {
    id: number;
    name: string;
    handle: string;
    avatar: string;
    role?: string;
    banned?: boolean;
}

export interface Comment {
    id: number;
    user: User;
    content: string;
    time: string;
    likes: number;
    isLiked?: boolean;
    canDelete?: boolean;
}

export interface Post {
    id: number;
    user: User | UserSummaryDTO; // Allow full user object or summary DTO
    time: string;
    readTime?: string;
    title?: string;
    content: string;
    fullContent?: string;
    images?: string[]; // Changed from image to images array
    image?: string; // Legacy/Fallback support
    alt?: string;
    likes: number;
    comments: number;
    shares?: number | string;
    isLiked?: boolean;
    isBookmarked?: boolean;
    canEdit?: boolean;    // True if current user owns this post
    canDelete?: boolean;  // True if owner OR admin
    tags?: string[];
    video?: {
        url: string;
        thumbnail: string;
        title: string;
        duration?: string;
    };
    category?: string;
    replies?: Comment[];
    reportsCount?: number;
    createdAt?: string; // ISO date string from backend
    hidden?: boolean;
}

export interface Notification {
    id: number;
    actorName: string;
    actorAvatar: string;
    actorId?: number; // ID of the user who triggered the notification
    type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SYSTEM' | 'NEW_POST';
    entityId: number;
    isRead: boolean;
    createdAt: string;
    message: string;
}

export interface AuthenticationResponse {
    token?: string;
}

export interface AuthenticationRequest {
    email?: string;
    password?: string;
}

export interface RegisterRequest {
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    role?: string;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    category?: string;
    readTime?: string;
    images?: string[]; // Changed from image to images array
    tags?: string[];
}
