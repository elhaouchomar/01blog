import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { APP_CONSTANTS } from '../../shared/constants/app.constants';
import { MaterialAlertService } from '../services/material-alert.service';

let lastTooManyRequestsPopupAt = 0;
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const API_BASE_URL = APP_CONSTANTS.API.BASE_URL.replace(/\/+$/, '');
const BANNED_POPUP_LOCK_KEY = '__bannedModalActive';

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function shouldAttachCsrf(url: string): boolean {
    if (url.startsWith('/')) return true;

    try {
        const baseOrigin = typeof window !== 'undefined'
            ? window.location.origin
            : 'http://localhost';
        const requestUrl = new URL(url, baseOrigin);
        const apiUrl = new URL(API_BASE_URL, baseOrigin);
        return requestUrl.origin === baseOrigin || requestUrl.origin === apiUrl.origin;
    } catch {
        return false;
    }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const alert = inject(MaterialAlertService);
    const setHeaders: Record<string, string> = {};
    if (UNSAFE_METHODS.has(req.method.toUpperCase()) && shouldAttachCsrf(req.url)) {
        const csrfToken = readCookie('XSRF-TOKEN');
        if (csrfToken) {
            setHeaders['X-XSRF-TOKEN'] = csrfToken;
        }
    }

    const authReq = req.clone({
        withCredentials: true,
        setHeaders
    });

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            const errorMessage = error.error?.message || error.message || '';

            if (error.status === 429) {
                const now = Date.now();
                if (now - lastTooManyRequestsPopupAt > 4000) {
                    lastTooManyRequestsPopupAt = now;
                    alert.fire({
                        icon: 'warning',
                        title: 'Too Many Requests',
                        text: 'You are sending requests too quickly. Please wait a few seconds and try again.',
                        toast: true,
                        position: 'top-end',
                        timer: 1800,
                        showConfirmButton: false
                    });
                }
                return throwError(() => error);
            }

            if (errorMessage.toLowerCase().includes('banned')) {
                const globalLock = typeof window !== 'undefined' && (window as any)[BANNED_POPUP_LOCK_KEY];
                if (req.url.includes('/auth/authenticate') || window.location.pathname === '/login' || globalLock) {
                    return throwError(() => error);
                }

                if (typeof window !== 'undefined') {
                    (window as any)[BANNED_POPUP_LOCK_KEY] = true;
                }

                alert.fire({
                    icon: 'error',
                    title: 'Account Restricted',
                    text: 'Your account has been restricted. You have been logged out.',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false
                }).then(() => {
                    if (typeof window !== 'undefined') {
                        (window as any)[BANNED_POPUP_LOCK_KEY] = false;
                    }
                    window.location.href = '/login';
                });
            }

            return throwError(() => error);
        })
    );
};
