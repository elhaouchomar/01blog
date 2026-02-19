import { Component, OnInit, effect, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { DataService } from '../../core/services/data.service';
import { MaterialAlertService } from '../../core/services/material-alert.service';
import { User } from '../../shared/models/data.models';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, NavbarComponent, SidebarComponent, RightSidebarComponent, FormsModule],
    templateUrl: './settings.html',
    styleUrl: './settings.css'
})
export class Settings implements OnInit {
    readonly NAME_MAX_LENGTH = 50;
    readonly BIO_MAX_LENGTH = 500;
    activeTab: string = 'Account';
    editForm = {
        firstname: '',
        lastname: '',
        bio: '',
        avatar: '',
        cover: '',
        subscribed: false
    };

    constructor(
        public dataService: DataService,
        private alert: MaterialAlertService,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) {
        effect(() => {
            const user = this.dataService.currentUser();
            if (user) {
                this.editForm = {
                    firstname: user.firstname || '',
                    lastname: user.lastname || '',
                    bio: user.bio || '',
                    avatar: user.avatar || '',
                    cover: user.cover || '',
                    subscribed: user.subscribed || false
                };
            }
        });
    }

    ngOnInit() {
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    saveSettings() {
        if (!this.dataService.currentUser()) return;
        this.editForm.firstname = this.sanitizeInput(this.editForm.firstname);
        this.editForm.lastname = this.sanitizeInput(this.editForm.lastname);
        this.editForm.bio = this.sanitizeInput(this.editForm.bio);

        const nameRegex = /^[A-Za-z\-']{2,50}$/;
        if (!nameRegex.test(this.editForm.firstname)) {
            this.alert.fire('Validation Error', 'First name must contain only letters and be 2-50 characters.', 'warning');
            return;
        }
        if (!nameRegex.test(this.editForm.lastname)) {
            this.alert.fire('Validation Error', 'Last name must contain only letters and be 2-50 characters.', 'warning');
            return;
        }
        if (this.editForm.bio && this.editForm.bio.length > this.BIO_MAX_LENGTH) {
            this.alert.fire('Validation Error', `Bio must be at most ${this.BIO_MAX_LENGTH} characters.`, 'warning');
            return;
        }

        this.dataService.updateProfile(this.editForm).subscribe({
            next: (updated) => {
                this.alert.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your changes have been saved successfully!',
                    timer: 3000,
                    toast: true,
                    position: 'top-end'
                });
            },
            error: (err) => {
                this.alert.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: 'Could not save changes. Please check your data and try again.'
                });
            }
        });
    }

    onFileSelected(event: any, type: 'avatar' | 'cover') {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.ngZone.run(() => {
                    if (type === 'avatar') {
                        this.editForm.avatar = e.target.result;
                    } else {
                        this.editForm.cover = e.target.result;
                    }
                    this.cdr.detectChanges();
                });
            };
            reader.readAsDataURL(file);
        }
    }

    deleteAccount() {
        this.alert.fire({
            title: 'Delete Account?',
            text: 'Are you sure you want to delete your account? This action cannot be undone and you will lose all your data.',
            icon: 'warning',
            showConfirmButton: true,
            confirmButtonText: 'Yes, Delete My Account',
            allowOutsideClick: false
        }).then((result) => {
            if (result.isConfirmed) {
                this.alert.fire({
                    icon: 'info',
                    title: 'Simulated',
                    text: 'Account deletion logic would be executed here.'
                });
            }
        });
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
