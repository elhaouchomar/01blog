import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../shared/models/data.models';
import { RouterLink, Router } from '@angular/router';
import { getInitials } from '../../shared/utils/string.utils';
import { DataService } from '../../core/services/data.service';

@Component({
    selector: 'app-dropdown-notif',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './dropdown-notif.html',
    styleUrl: './dropdown-notif.css'
})
export class DropdownNotifComponent {
    @Input() notifications: Notification[] = [];
    @Output() onClose = new EventEmitter<void>();
    @Output() onNotificationClick = new EventEmitter<Notification>();
    @Output() onMarkAllRead = new EventEmitter<void>();

    isOpen = false; // Controlled by parent via *ngIf usually, but kept for internal logic if needed? 
    // Navbar uses *ngIf="isNotificationsOpen". So this component is created/destroyed.

    constructor(private router: Router, private dataService: DataService) { }

    // Helper to format date
    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Use shared utility
    getInitials = getInitials;

    handleNotificationClick(notification: Notification, event: Event) {
        event.stopPropagation();
        this.onNotificationClick.emit(notification);
    }

    markAllRead(event: Event) {
        event.stopPropagation();
        this.onMarkAllRead.emit();
        this.notifications.forEach(n => n.isRead = true);
    }
}
