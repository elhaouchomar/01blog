import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { DataService } from '../../services/data.service';
import { User } from '../../models/data.models';
import { MaterialAlertService } from '../../services/material-alert.service';

@Component({
    selector: 'app-edit-profile-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-profile.html',
    styleUrl: './edit-profile.css'
})
export class EditProfileModal implements OnInit {
    user: User | null = null;
    form = {
        firstname: '',
        lastname: '',
        role: '',
        bio: '',
        banned: false
    };

    constructor(
        protected modalService: ModalService,
        private dataService: DataService,
        private alert: MaterialAlertService
    ) { }

    ngOnInit() {
        this.user = this.modalService.modalData();
        if (this.user) {
            this.form = {
                firstname: this.user.firstname || '',
                lastname: this.user.lastname || '',
                role: this.user.role || 'USER',
                bio: this.user.bio || '',
                banned: this.user.banned || false
            };
        }
    }

    save() {
        if (!this.user) return;

        this.form.firstname = this.sanitizeInput(this.form.firstname);
        this.form.lastname = this.sanitizeInput(this.form.lastname);
        this.form.bio = this.sanitizeInput(this.form.bio);

        const nameRegex = /^[A-Za-z\-']{2,50}$/;
        if (!nameRegex.test(this.form.firstname)) {
            this.alert.fire('Validation Error', 'First name must contain only letters and be 2-50 characters.', 'warning');
            return;
        }
        if (!nameRegex.test(this.form.lastname)) {
            this.alert.fire('Validation Error', 'Last name must contain only letters and be 2-50 characters.', 'warning');
            return;
        }
        if (this.form.bio && this.form.bio.length > 500) {
            this.alert.fire('Validation Error', 'Bio must be less than 500 characters.', 'warning');
            return;
        }

        this.dataService.updateProfile({ ...this.form, id: this.user.id } as any).subscribe({
            next: () => {
                this.dataService.loadUsers();
                this.modalService.close();
                this.alert.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: 'Profile updated',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true
                });
            },
            error: (err) => {
                console.error('Error updating user:', err);
                this.alert.fire('Error', 'Failed to update user.', 'error');
            }
        });
    }

    close() {
        this.modalService.close();
    }

    private sanitizeInput(value: string): string {
        if (typeof document === 'undefined') {
            return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        }
        const div = document.createElement('div');
        div.innerHTML = value;
        return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
    }
}
