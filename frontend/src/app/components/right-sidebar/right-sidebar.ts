import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { User } from '../../shared/models/data.models';
import { getInitials } from '../../shared/utils/string.utils';
import { MaterialAlertService } from '../../core/services/material-alert.service';

@Component({
    selector: 'app-right-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './right-sidebar.html',
    styleUrls: ['./right-sidebar.css']
})
export class RightSidebarComponent implements OnInit {
    suggestedUsers: User[] = [];
    private static cachedSuggestions: User[] = [];
    private static removedSuggestionIds = new Set<number>();
    private deferredApplyTimer: any = null;

    constructor(
        private dataService: DataService,
        private alert: MaterialAlertService
    ) {
        effect(() => {
            const users = this.dataService.allUsers();
            if (
                users.length > 0 &&
                this.suggestedUsers.length === 0 &&
                RightSidebarComponent.cachedSuggestions.length === 0
            ) {
                if (this.deferredApplyTimer) {
                    clearTimeout(this.deferredApplyTimer);
                }
                this.deferredApplyTimer = setTimeout(() => {
                    this.deferredApplyTimer = null;
                    this.applySuggestions(users);
                }, 0);
            }
        });
    }

    ngOnInit() {
        if (RightSidebarComponent.cachedSuggestions.length > 0) {
            this.suggestedUsers = RightSidebarComponent.cachedSuggestions
                .filter(u => !RightSidebarComponent.removedSuggestionIds.has(u.id));
            return;
        }

        // Defer first load to next microtask to avoid NG0100 in dev mode.
        queueMicrotask(() => this.loadSuggestions());
    }

    loadSuggestions() {
        const users = this.dataService.allUsers();

        if (users.length > 0) {
            this.applySuggestions(users);
            return;
        }

        this.dataService.getUsers().subscribe({
            next: (fetchedUsers) => this.applySuggestions(fetchedUsers),
            error: () => {},
        });
    }

    private applySuggestions(users: User[]) {
        const currentUser = this.dataService.getCurrentUser();
        const filtered = users
            .filter(u =>
                String(u.id) !== String(currentUser?.id) &&
                !u.isFollowing &&
                !RightSidebarComponent.removedSuggestionIds.has(u.id)
            )
            .slice(0, 4)
            .map(u => ({ ...u }));

        this.suggestedUsers = filtered;
        RightSidebarComponent.cachedSuggestions = filtered;
    }

    toggleSubscribe(user: any, event: Event) {
        event.stopPropagation();
        // Update locally for immediate UI feedback
        user.isFollowing = true;
        RightSidebarComponent.cachedSuggestions = this.suggestedUsers.map(u =>
            u.id === user.id ? { ...u, isFollowing: true } : u
        );

        this.dataService.followUser(user.id).subscribe({
            next: () => {
                this.alert.fire({
                    icon: 'success',
                    title: `Subscribed to ${user.name}`,
                    toast: true,
                    position: 'top-end',
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: (err) => {
                // Revert on error
                user.isFollowing = false;
                RightSidebarComponent.cachedSuggestions = this.suggestedUsers.map(u =>
                    u.id === user.id ? { ...u, isFollowing: false } : u
                );
                this.alert.fire('Error', err.error?.message || 'Failed to subscribe.', 'error');
            }
        });
    }

    removeFromSuggestions(userId: number) {
        RightSidebarComponent.removedSuggestionIds.add(userId);
        this.suggestedUsers = this.suggestedUsers.filter(u => u.id !== userId);
        RightSidebarComponent.cachedSuggestions = RightSidebarComponent.cachedSuggestions.filter(u => u.id !== userId);
    }

    // Use shared utility
    getInitials = getInitials;
}
