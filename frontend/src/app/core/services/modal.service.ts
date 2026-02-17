import { Injectable, signal } from '@angular/core';

export type ModalType = 'create-post' | 'edit-post' | 'post-details' | 'report-post' | 'report' | 'success' | 'confirm-delete-post' | 'confirm-delete' | 'delete-v2' | 'media-viewer' | 'edit-profile' | 'create-user' | 'confirm-ban' | 'admin-edit-user' | null;

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    readonly activeModal = signal<ModalType>(null);
    readonly modalData = signal<any>(null);

    open(type: ModalType, data: any = null) {
        console.log('ModalService opening:', type, data);
        this.modalData.set(data);
        this.activeModal.set(type);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    close() {
        this.activeModal.set(null);
        this.modalData.set(null);
        document.body.style.overflow = ''; // Restore scrolling
    }
}
