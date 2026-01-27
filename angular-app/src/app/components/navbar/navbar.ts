import { Component, OnInit, ChangeDetectorRef, OnDestroy, HostListener, ElementRef, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ModalService } from '../../services/modal.service';
import { DropdownNotifComponent } from '../dropdown-notif/dropdown-notif';
import { filter, debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, DropdownNotifComponent],
    templateUrl: './navbar.html',
    styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
    isNotificationsOpen = false;
    isProfileOpen = false;
    isNotificationRoute = false;
    isSearchOpen = false;
    isMobileSearch = false;

    // Search
    searchQuery = '';
    searchFilter = 'all';
    searchResults: any[] = [];
    searchAttempted = false;
    isSearching = false;
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(
        public modalService: ModalService,
        public dataService: DataService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private elementRef: ElementRef
    ) {
        // Track current route to highlight notification icon correctly
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe((event: any) => {
            this.isNotificationRoute = event.urlAfterRedirects === '/notifications';
            this.cdr.detectChanges();
        });

        // Reactive effect for current user changes
        effect(() => {
            const user = this.dataService.currentUser();
            if (user) {
                // Any specific logic when user changes
                this.cdr.detectChanges();
            }
        });
    }

    ngOnInit() {
        // Add click outside listener
        document.addEventListener('click', this.handleClickOutside.bind(this));

        // Add keyboard listener for Escape key
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Setup search debouncing
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(query => {
            if (query.length >= 2) {
                this.performSearch();
            } else {
                this.searchResults = [];
                this.searchAttempted = false;
                this.isSearching = false;
                this.cdr.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        // Remove event listeners
        document.removeEventListener('click', this.handleClickOutside.bind(this));
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
        this.destroy$.next();
        this.destroy$.complete();
    }

    private handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;

        // Close profile dropdown if clicked outside
        if (this.isProfileOpen && !target.closest('.user-menu')) {
            this.isProfileOpen = false;
            this.cdr.detectChanges();
        }

        // Close notification dropdown if clicked outside
        if (this.isNotificationsOpen && !target.closest('.notif-wrapper')) {
            this.isNotificationsOpen = false;
            this.cdr.detectChanges();
        }

        // Close search if clicked outside (for desktop)
        if (this.isSearchOpen && !this.isMobileSearch) {
            if (!target.closest('.search-container') && !target.closest('.mobile-search-btn')) {
                this.closeSearch();
            }
        }

        // Close mobile search if clicked outside
        if (this.isMobileSearch && !target.closest('.mobile-search-bar') && !target.closest('.mobile-search-btn')) {
            this.closeSearch();
        }
    }

    private handleKeydown(event: KeyboardEvent) {
        // Close dropdowns on Escape key
        if (event.key === 'Escape') {
            if (this.isProfileOpen) {
                this.isProfileOpen = false;
            }
            if (this.isNotificationsOpen) {
                this.isNotificationsOpen = false;
            }
            if (this.isSearchOpen) {
                this.closeSearch();
            }
            this.cdr.detectChanges();
        }
    }

    handleNotificationClick(notification: any, event?: Event) {
        if (event) {
            event.stopPropagation();
        }

        // Mark as read first
        if (!notification.isRead) {
            this.dataService.markAsRead(notification.id).subscribe();
        }

        // Navigate based on notification type
        if (notification.type === 'LIKE' || notification.type === 'COMMENT' || notification.type === 'NEW_POST') {
            // Redirect to post detail page
            if (notification.entityId) {
                this.modalService.open('post-details', { id: notification.entityId });
                this.isNotificationsOpen = false; // Close dropdown
            }
        } else if (notification.type === 'FOLLOW') {
            // For FOLLOW, redirect to actor's profile
            if (notification.actorId) {
                this.router.navigate(['/profile', notification.actorId]);
                this.isNotificationsOpen = false; // Close dropdown
            } else if (notification.entityId) {
                // Fallback: use entityId if actorId is not available
                this.router.navigate(['/profile', notification.entityId]);
                this.isNotificationsOpen = false; // Close dropdown
            }
        }

        this.cdr.detectChanges();
    }

    handleActorClick(notification: any, event: Event) {
        event.stopPropagation();
        if (notification.actorId) {
            this.router.navigate(['/profile', notification.actorId]);
            this.isNotificationsOpen = false; // Close dropdown
        }
        this.cdr.detectChanges();
    }

    markAllRead() {
        this.dataService.markAllAsRead().subscribe();
    }

    toggleUserMenu() {
        this.isProfileOpen = !this.isProfileOpen;
        this.isNotificationsOpen = false;
        this.isSearchOpen = false;
        this.isMobileSearch = false;
        this.cdr.detectChanges();
    }

    toggleNotifications() {
        if (window.innerWidth < 1024) {
            this.router.navigate(['/notifications']);
            this.isNotificationsOpen = false;
        } else {
            this.isNotificationsOpen = !this.isNotificationsOpen;
            if (this.isNotificationsOpen) {
                this.isProfileOpen = false; // Close profile when notifications open
                this.isSearchOpen = false;
                this.isMobileSearch = false;
            }
        }
        this.cdr.detectChanges();
    }

    toggleSearch() {
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            this.isMobileSearch = !this.isMobileSearch;
            this.isSearchOpen = this.isMobileSearch;

            if (this.isMobileSearch && this.searchQuery.trim().length >= 2) {
                this.performSearch();
            }
        } else {
            this.isSearchOpen = !this.isSearchOpen;
            this.isMobileSearch = false;
        }

        if (this.isSearchOpen) {
            this.isProfileOpen = false;
            this.isNotificationsOpen = false;

            // Focus the appropriate search input
            setTimeout(() => {
                if (isMobile) {
                    const mobileInput = document.querySelector('.mobile-search-header .search-input') as HTMLInputElement;
                    if (mobileInput) {
                        mobileInput.focus();
                    }
                } else {
                    const searchInput = document.querySelector('.desktop-search .search-input') as HTMLInputElement;
                    if (searchInput) {
                        searchInput.focus();
                    }
                }
            }, 100);
        } else {
            this.closeSearch();
        }

        this.cdr.detectChanges();
    }

    // Search methods
    onSearchInput() {
        if (this.searchQuery.trim().length >= 2) {
            this.isSearching = true;
            this.searchSubject.next(this.searchQuery.trim());
        } else {
            this.searchResults = [];
            this.searchAttempted = false;
            this.isSearching = false;
            if (!this.isMobileSearch) {
                this.isSearchOpen = false;
            }
        }
        this.cdr.detectChanges();
    }

    onSearchFocus() {
        if (!this.isMobileSearch) {
            this.isSearchOpen = true;
            this.cdr.detectChanges();
        }
    }

    onSearchBlur() {
        // Blur logic handled by handleClickOutside for better desktop experience
    }

    clearSearch() {
        this.searchQuery = '';
        this.searchResults = [];
        this.isSearchOpen = false;
        this.isMobileSearch = false;
        this.searchAttempted = false;
        this.searchFilter = 'all';
        this.cdr.detectChanges();
    }

    setFilter(filter: string) {
        this.searchFilter = filter;
        if (this.searchQuery.trim().length >= 2) {
            this.performSearch();
        }
        this.cdr.detectChanges();
    }

    performSearch() {
        if (!this.searchQuery.trim()) {
            this.searchResults = [];
            this.isSearchOpen = false;
            this.searchAttempted = false;
            this.isSearching = false;
            this.cdr.detectChanges();
            return;
        }

        this.isSearching = true;
        this.searchAttempted = true;
        this.dataService.search(this.searchQuery.trim(), this.searchFilter).subscribe({
            next: (response) => {
                this.searchResults = this.processSearchResults(response);
                this.isSearchOpen = true;
                this.isSearching = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Search error:', err);
                this.searchResults = [];
                this.isSearchOpen = true;
                this.isSearching = false;
                this.cdr.detectChanges();
            }
        });
    }

    private processSearchResults(response: any): any[] {
        const results: any[] = [];

        if (response.posts) {
            response.posts.forEach((post: any) => {
                results.push({
                    type: 'post',
                    id: post.id,
                    title: post.title,
                    author: post.user?.name || 'Unknown',
                    content: post.content?.substring(0, 100) + '...'
                });
            });
        }

        if (response.users) {
            response.users.forEach((user: any) => {
                results.push({
                    type: 'user',
                    id: user.id,
                    name: user.name,
                    username: user.username || user.handle?.substring(1),
                    avatar: user.avatar
                });
            });
        }

        return results.slice(0, 10); // Limit to 10 results
    }

    navigateToResult(result: any) {
        this.isSearchOpen = false;
        this.isMobileSearch = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.searchAttempted = false;

        if (result.type === 'user') {
            this.router.navigate(['/profile', result.id]);
        } else if (result.type === 'post') {
            this.router.navigate(['/post', result.id]);
        }

        this.cdr.detectChanges();
    }

    closeSearch() {
        this.isSearchOpen = false;
        this.isMobileSearch = false;
        this.searchQuery = '';
        this.searchResults = [];
        this.searchAttempted = false;
        this.cdr.detectChanges();
    }

    getResultIcon(type: string): string {
        switch (type) {
            case 'user': return 'person';
            case 'post': return 'article';
            default: return 'search';
        }
    }

    // Listen for window resize to adjust mobile search state
    @HostListener('window:resize', ['$event'])
    onResize(event: Event) {
        if (window.innerWidth > 768 && this.isMobileSearch) {
            this.isMobileSearch = false;
            this.isSearchOpen = false;
            this.cdr.detectChanges();
        }
    }
}