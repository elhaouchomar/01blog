import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MaterialAlertService } from '../services/material-alert.service';

let lastTooManyRequestsPopupAt = 0;
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function shouldAttachCsrf(url: string): boolean {
    return url.startsWith('/') || url.startsWith('http://localhost:8080');
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
                        confirmButtonText: 'OK'
                    });
                }
                return throwError(() => error);
            }

            if (errorMessage.toLowerCase().includes('banned')) {
                if (req.url.includes('/auth/authenticate') || window.location.pathname === '/login') {
                    return throwError(() => error);
                }

                alert.fire({
                    icon: 'error',
                    title: 'Account Restricted',
                    text: 'Your account has been restricted. You have been logged out.',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false
                }).then(() => {
                    window.location.href = '/login';
                });
            }

            return throwError(() => error);
        })
    );
};
