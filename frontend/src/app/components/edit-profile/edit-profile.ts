import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { DataService } from '../../services/data.service';
import { User } from '../../models/data.models';
import Swal from 'sweetalert2';

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

    constructor(protected modalService: ModalService, private dataService: DataService) { }

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

        const nameRegex = /^[A-Za-z\-']{2,50}$/;
        if (!nameRegex.test(this.form.firstname)) {
            Swal.fire('Validation Error', 'First name must contain only letters and be 2-50 characters.', 'warning');
            return;
        }
        if (!nameRegex.test(this.form.lastname)) {
            Swal.fire('Validation Error', 'Last name must contain only letters and be 2-50 characters.', 'warning');
            return;
        }
        if (this.form.bio && this.form.bio.length > 500) {
            Swal.fire('Validation Error', 'Bio must be less than 500 characters.', 'warning');
            return;
        }

        this.dataService.updateProfile({ ...this.form, id: this.user.id } as any).subscribe({
            next: () => {
                this.dataService.loadUsers();
                this.modalService.close();
                Swal.fire({
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
                Swal.fire('Error', 'Failed to update user.', 'error');
            }
        });
    }

    close() {
        this.modalService.close();
    }
}
