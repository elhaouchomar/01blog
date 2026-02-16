import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import Alert from 'sweetalert2';

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
                // Prevent popup spam when multiple requests fail at once.
                if (now - lastTooManyRequestsPopupAt > 4000) {
                    lastTooManyRequestsPopupAt = now;
                    Alert.fire({
                        icon: 'warning',
                        title: 'Too Many Requests',
                        text: 'You are sending requests too quickly. Please wait a few seconds and try again.',
                        confirmButtonText: 'OK'
                    });
                }
                return throwError(() => error);
            }

            // Check if user is banned from the server response
            if (errorMessage.toLowerCase().includes('banned')) {
                // If we are already on the login page or trying to login, let the local component handle it
                if (req.url.includes('/auth/authenticate') || window.location.pathname === '/login') {
                    return throwError(() => error);
                }

                Alert.fire({
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
