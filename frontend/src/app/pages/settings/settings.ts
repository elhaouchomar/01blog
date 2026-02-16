import { Component, OnInit, effect, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { DataService } from '../../services/data.service';
import { User } from '../../models/data.models';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, NavbarComponent, SidebarComponent, RightSidebarComponent, FormsModule],
    templateUrl: './settings.html',
    styleUrl: './settings.css'
})
export class Settings implements OnInit {
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
        this.status = { message: 'Updating profile...', type: 'info', visible: true };

        this.dataService.updateProfile(this.editForm).subscribe({
            next: (updated) => {
                this.showStatus('Profile updated successfully!', 'success');
            },
            error: (err) => {
                console.error('Failed to update profile:', err);
                this.showStatus('Failed to update profile. Please try again.', 'error');
            }
        });
    }

    status = {
        message: '',
        type: 'success' as 'success' | 'error' | 'info',
        visible: false
    };

    private statusTimeout: any;

    showStatus(message: string, type: 'success' | 'error' | 'info' = 'success') {
        clearTimeout(this.statusTimeout);
        this.status = { message, type, visible: true };
        this.statusTimeout = setTimeout(() => {
            this.status.visible = false;
        }, 5000);
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
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            alert('Account deletion simulated.');
        }
    }
}
