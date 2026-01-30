
import { Injectable, signal } from '@angular/core';
import Swal from 'sweetalert2';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);
    private counter = 0;

    show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
        Swal.fire({
            position: 'top-end',
            icon: type,
            title: message,
            showConfirmButton: false,
            timer: duration,
            toast: true,
            background: type === 'error' ? '#fff1f0' : '#fff',
            iconColor: type === 'error' ? '#ff4d4f' : (type === 'success' ? '#52c41a' : '#1890ff')
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

    remove(id: number) {
        // No longer needed with Swal, but kept for interface compatibility
    }
}
