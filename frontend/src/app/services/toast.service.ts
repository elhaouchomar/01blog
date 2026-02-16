import { Injectable } from '@angular/core';
import { MaterialAlertService } from './material-alert.service';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    constructor(private alert: MaterialAlertService) { }

    show(message: string, type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info', duration = 3000) {
        this.alert.fire({
            position: 'top-end',
            icon: type,
            title: message,
            showConfirmButton: false,
            timer: duration,
            toast: true
        });
    }

    success(message: string, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 3000) {
        this.show(message, 'error', duration);
    }

    info(message: string, duration = 3000) {
        this.show(message, 'info', duration);
    }

    remove(_id?: number) {
        // No-op kept for backward compatibility with legacy callers.
    }
}
