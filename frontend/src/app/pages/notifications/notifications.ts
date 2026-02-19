import { Component, OnInit, ChangeDetectorRef, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { DataService } from '../../core/services/data.service';
import { Notification as AppNotification } from '../../shared/models/data.models';
import { ModalService } from '../../core/services/modal.service';
import { getInitials } from '../../shared/utils/string.utils';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [NavbarComponent, SidebarComponent, RightSidebarComponent, CommonModule, RouterModule],
    templateUrl: './notifications.html',
    styleUrl: './notifications.css'
})
export class Notifications implements OnInit {
    activeFilter = signal('All');
    private page = 0;
    readonly pageSize = 20;
    isLoadingMore = signal(false);
    isMoreAvailable = signal(true);
    private readonly scrollThreshold = 220;

    filteredNotifications = computed(() => {
        const all = this.dataService.notifications();
        const filter = this.activeFilter();

        if (filter === 'All') return all;
        if (filter === 'Unread') return all.filter(n => !n.isRead);

        const map: { [key: string]: string } = {
            'Comments': 'COMMENT',
            'Likes': 'LIKE',
            'Subscriptions': 'FOLLOW',
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
        this.loadInitialNotifications();
    }

    setFilter(filter: string) {
        this.activeFilter.set(filter);
    }

    private loadInitialNotifications() {
        this.page = 0;
        this.isMoreAvailable.set(true);
        this.dataService.fetchNotifications(this.page, this.pageSize, false).subscribe({
            next: (notifs) => {
                this.isMoreAvailable.set(notifs.length >= this.pageSize);
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isMoreAvailable.set(false);
            }
        });
    }

    private loadMoreNotifications() {
        if (this.isLoadingMore() || !this.isMoreAvailable()) return;

        this.isLoadingMore.set(true);
        this.page++;
        this.dataService.fetchNotifications(this.page, this.pageSize, true).subscribe({
            next: (notifs) => {
                this.isMoreAvailable.set(notifs.length >= this.pageSize);
                this.isLoadingMore.set(false);
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoadingMore.set(false);
                this.page = Math.max(0, this.page - 1);
            }
        });
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

    // Use shared utility
    getInitials = getInitials;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        if (this.isLoadingMore() || !this.isMoreAvailable()) return;

        const viewportBottom = window.innerHeight + window.scrollY;
        const pageHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        );

        if (viewportBottom >= pageHeight - this.scrollThreshold) {
            this.loadMoreNotifications();
        }
    }
}
