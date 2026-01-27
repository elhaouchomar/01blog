import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { DataService } from '../../services/data.service';
import { User } from '../../models/data.models';
import { ModalService } from '../../services/modal.service';

@Component({
    selector: 'app-network',
    standalone: true,
    imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, RightSidebarComponent],
    templateUrl: './network.html',
    styleUrl: './network.css'
})
export class Network implements OnInit {
    users: User[] = [];

    constructor(
        private dataService: DataService,
        protected modalService: ModalService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) { }

    ngOnInit() {
        // Load immediately
        this.loadUsers();

        // Don't reload on user change to keep subscribed users visible until refresh
    }

    navigateToProfile(userId: number) {
        this.router.navigate(['/profile', userId]);
    }

    loadUsers() {
        this.dataService.getUsers().subscribe({
            next: (data: User[]) => {
                const currentUser = this.dataService.currentUser();
                this.users = data.filter(user => user.id !== currentUser?.id && !user.isFollowing);
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error loading users', err)
        });
    }

    toggleSubscribe(user: User) {
        // Update locally for immediate UI feedback
        user.isFollowing = true;
        this.cdr.detectChanges();

        this.dataService.followUser(user.id).subscribe({
            next: () => {
                // Successfully subscribed
            },
            error: (err) => {
                console.error('Error subscribing to user:', err);
                // Revert on error
                user.isFollowing = false;
                this.cdr.detectChanges();
            }
        });
    }

    removeFromSuggestions(user: User) {
        this.users = this.users.filter(u => u.id !== user.id);
        this.cdr.detectChanges();
    }

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
