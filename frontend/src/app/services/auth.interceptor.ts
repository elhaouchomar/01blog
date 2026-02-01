import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');
    let authReq = req;

    if (token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            const errorMessage = error.error?.message || error.message || '';

            // Check if user is banned from the server response
            if (errorMessage.toLowerCase().includes('banned')) {
                localStorage.removeItem('auth_token');

                // If we are already on the login page or trying to login, let the local component handle it
                if (req.url.includes('/auth/authenticate') || window.location.pathname === '/login') {
                    return throwError(() => error);
                }

                Swal.fire({
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
