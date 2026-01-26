import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { DataService } from '../../services/data.service';
import { User } from '../../models/data.models';

@Component({
    selector: 'app-admin-edit-user',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="modal-overlay" (click)="close()">
        <div class="modal-container" (click)="$event.stopPropagation()">
            <div class="modal-header">
                <h2 class="modal-title">Edit User: {{user?.name}}</h2>
                <button class="modal-close-btn" (click)="close()">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="modal-content">
                <form class="modal-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">First Name</label>
                            <input [(ngModel)]="form.firstname" name="firstname" type="text" class="input-field">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name</label>
                            <input [(ngModel)]="form.lastname" name="lastname" type="text" class="input-field">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">User Role</label>
                        <select [(ngModel)]="form.role" name="role" class="input-field">
                            <option value="USER">Standard User</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Biography</label>
                        <textarea [(ngModel)]="form.bio" name="bio" class="textarea-field" rows="3"></textarea>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" (click)="close()">Cancel</button>
                <button class="btn btn-primary" (click)="save()">Save Changes</button>
            </div>
        </div>
    </div>
    `,
    styles: [`
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    `]
})
export class AdminEditUser implements OnInit {
    user: User | null = null;
    form = {
        firstname: '',
        lastname: '',
        role: '',
        bio: ''
    };

    constructor(protected modalService: ModalService, private dataService: DataService) { }

    ngOnInit() {
        this.user = this.modalService.modalData();
        if (this.user) {
            this.form = {
                firstname: this.user.firstname || '',
                lastname: this.user.lastname || '',
                role: this.user.role || 'USER',
                bio: this.user.bio || ''
            };
        }
    }

    save() {
        if (!this.user) return;
        this.dataService.adminUpdateUser(this.user.id, this.form as any).subscribe({
            next: () => {
                this.modalService.close();
            },
            error: (err) => {
                console.error('Error updating user:', err);
                alert('Failed to update user. Please check your permissions.');
            }
        });
    }

    close() {
        this.modalService.close();
    }
}
