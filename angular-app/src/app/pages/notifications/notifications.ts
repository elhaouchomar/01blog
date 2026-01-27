import { Component, OnInit, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { DataService } from '../../services/data.service';
import { Notification as AppNotification } from '../../models/data.models';
import { ModalService } from '../../services/modal.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [NavbarComponent, SidebarComponent, RightSidebarComponent, CommonModule, RouterModule],
    templateUrl: './notifications.html',
    styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
    activeFilter = signal('All');

    filteredNotifications = computed(() => {
        const all = this.dataService.notifications();
        const filter = this.activeFilter();

        if (filter === 'All') return all;
        if (filter === 'Unread') return all.filter(n => !n.isRead);

        const map: { [key: string]: string } = {
            'Comments': 'COMMENT',
            'Likes': 'LIKE',
            'Follows': 'FOLLOW',
            'Posts': 'NEW_POST',
            'Events': 'SYSTEM'
        };
        const type = map[filter];
        return type ? all.filter(n => n.type === type) : [];
    });

    constructor(
        public dataService: DataService,
        private router: Router,
        protected modalService: ModalService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        if (this.dataService.notifications().length === 0) {
            this.dataService.loadNotifications();
        }
    }

    setFilter(filter: string) {
        this.activeFilter.set(filter);
    }

    markAllAsRead() {
        this.dataService.markAllAsRead().subscribe();
    }

    get unreadCount(): number {
        return this.dataService.notifications().filter(n => !n.isRead).length;
    }

    handleNotificationClick(notification: AppNotification, event?: Event) {
        if (event) {
            event.stopPropagation();
        }

        // Mark as read if not already read
        if (!notification.isRead) {
            this.dataService.markAsRead(notification.id).subscribe();
        }

        // Navigate based on notification type
        if (notification.type === 'LIKE' || notification.type === 'COMMENT' || notification.type === 'NEW_POST') {
            // Redirect to post detail page
            if (notification.entityId) {
                this.modalService.open('post-details', { id: notification.entityId });
            }
        } else if (notification.type === 'FOLLOW') {
            // For FOLLOW, entityId is the actor's (follower's) ID
            // Redirect to their profile
            if (notification.actorId) {
                this.router.navigate(['/profile', notification.actorId]);
            } else if (notification.entityId) {
                // Fallback: use entityId if actorId is not available
                this.router.navigate(['/profile', notification.entityId]);
            }
        }
    }

    handleActorClick(notification: AppNotification, event: Event) {
        event.stopPropagation();
        if (notification.actorId) {
            this.router.navigate(['/profile', notification.actorId]);
        }
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
