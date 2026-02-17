/**
 * String utility functions
 */

export function getInitials(name: string | undefined | null): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function truncate(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function formatHandle(handle: string): string {
    return handle.startsWith('@') ? handle : `@${handle}`;
}
