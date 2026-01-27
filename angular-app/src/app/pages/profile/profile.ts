import { Component, OnInit, ChangeDetectorRef, effect, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { DataService } from '../../services/data.service';
import { User, Post } from '../../models/data.models';
import { ModalService } from '../../services/modal.service';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { ActionMenuComponent, ActionMenuItem } from '../../components/action-menu/action-menu';
import { getInitials } from '../../utils/string.utils';
import { PostCardComponent } from '../../components/post-card/post-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NavbarComponent, SidebarComponent, RightSidebarComponent, CommonModule, RouterModule, ActionMenuComponent, PostCardComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  isMenuOpen = false;
  user: User | null = null;
  posts: Post[] = [];
  isLoading = false;
  activeTab = 'Posts';

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private elementRef: ElementRef
  ) {
    // Handle route changes
    this.route.params.subscribe(params => {
      const userId = params['id'];
      if (userId) {
        this.loadUserProfile(parseInt(userId));
      } else {
        // If on own profile, sync with currentUser signal
        const cu = this.dataService.currentUser();
        if (cu) {
          this.user = cu;
          this.loadPosts();
          this.cdr.detectChanges();
        }
      }
    });

    // Sync with current user changes if on own profile
    effect(() => {
      const cu = this.dataService.currentUser();
      const isOwn = !this.route.snapshot.params['id'];
      if (isOwn && cu) {
        this.user = cu;
        this.loadPosts();
        this.cdr.detectChanges();
      }
    });

    // Shared refresh logic for data signal changes
    effect(() => {
      const allPosts = this.dataService.posts();
      if (this.user && this.user.id) {
        // Reload this profile's post list when global posts signal changes (e.g. after adding a post)
        this.loadPosts();
      }
    });
  }

  ngOnInit() { }

  setTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  loadUserProfile(userId: number) {
    this.isLoading = true;
    this.dataService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loadPosts();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.isLoading = false;
        this.router.navigate(['/profile']);
      }
    });
  }

  toggleMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
    console.log('Profile Menu Toggled:', this.isMenuOpen);
  }

  get isOwnProfile(): boolean {
    const cu = this.dataService.currentUser();
    return !!(cu && this.user && cu.id === this.user.id);
  }

  loadPosts() {
    if (!this.user || !this.user.id) return;

    this.dataService.getUserPosts(this.user.id).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading user posts:', err)
    });
  }

  reportUser() {
    this.isMenuOpen = false;
    if (this.user) {
      const reportData = { ...this.user, reportType: 'user' };
      this.modalService.open('report', reportData);
    }
  }

  toggleSubscribe() {
    if (this.user) {
      this.dataService.followUser(this.user.id).subscribe({
        next: () => {
          if (this.user) {
            this.loadUserProfile(this.user.id);
          }
        },
        error: (err) => console.error('Error toggling subscribe:', err)
      });
    }
  }

  // Use shared utility  
  getInitials = getInitials;

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  get currentUserIsAdmin(): boolean {
    return this.dataService.currentUser()?.role === 'ADMIN';
  }

  get profileActions(): ActionMenuItem[] {
    if (!this.user) return [];
    return [
      { id: 'report', label: 'Report User', icon: 'flag' },
      {
        id: 'ban',
        label: this.user.banned ? 'Unban User' : 'Ban User',
        icon: this.user.banned ? 'gavel' : 'block',
        class: 'delete',
        showIf: this.currentUserIsAdmin
      }
    ];
  }

  handleDropdownAction(actionId: string) {
    if (actionId === 'report') this.reportUser();
    if (actionId === 'ban') this.toggleBan();
  }

  toggleBan() {
    this.isMenuOpen = false;
    if (this.user && this.user.id) {
      this.modalService.open('confirm-ban', {
        id: this.user.id,
        name: this.user.name,
        isBanned: this.user.banned
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isMenuOpen = false;
      this.cdr.detectChanges();
    }
  }
}
