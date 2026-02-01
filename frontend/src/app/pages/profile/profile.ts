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
import Swal from 'sweetalert2';

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
  currentPage = 0;
  pageSize = 10;
  isMoreAvailable = true;

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

  loadPosts(append: boolean = false) {
    if (!this.user || !this.user.id) return;

    if (!append) {
      this.currentPage = 0;
      this.isMoreAvailable = true;
    }

    this.dataService.getUserPosts(this.user.id, this.currentPage, this.pageSize).subscribe({
      next: (posts) => {
        if (append) {
          this.posts = [...this.posts, ...posts];
        } else {
          this.posts = posts;
        }
        this.isMoreAvailable = posts.length >= this.pageSize;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading user posts:', err)
    });
  }

  loadMore() {
    this.currentPage++;
    this.loadPosts(true);
  }

  reportUser() {
    this.isMenuOpen = false;
    if (this.user) {
      Swal.fire({
        title: 'Report User?',
        text: `Are you sure you want to report ${this.user.name}? This helps our community stay safe.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Report',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.dataService.reportContent('General Report', this.user!.id).subscribe({
            next: () => {
              Swal.fire({
                icon: 'success',
                title: 'Reported',
                text: 'Thank you. Our team will review this user.',
                timer: 2000,
                toast: true,
                position: 'top-end',
                showConfirmButton: false
              });
            },
            error: () => Swal.fire('Error', 'Failed to submit report.', 'error')
          });
        }
      });
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
      },
      {
        id: 'delete',
        label: 'Delete User',
        icon: 'delete_forever',
        class: 'delete',
        showIf: this.currentUserIsAdmin
      }
    ];
  }

  handleDropdownAction(actionId: string) {
    if (actionId === 'report') this.reportUser();
    if (actionId === 'ban') this.toggleBan();
    if (actionId === 'delete') this.deleteUser();
  }

  deleteUser() {
    this.isMenuOpen = false;
    if (this.user && this.user.id) {
      Swal.fire({
        title: 'Delete User?',
        text: `Are you sure you want to permanently delete ${this.user.name}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      }).then((result) => {
        if (result.isConfirmed) {
          this.dataService.deleteUserAction(this.user!.id).subscribe({
            next: () => {
              Swal.fire('Deleted!', 'User has been removed.', 'success');
              this.router.navigate(['/home']);
            },
            error: () => Swal.fire('Error', 'Failed to delete user.', 'error')
          });
        }
      });
    }
  }

  toggleBan() {
    this.isMenuOpen = false;
    if (this.user && this.user.id) {
      const action = this.user.banned ? 'Unban' : 'Ban';
      Swal.fire({
        title: `${action} User?`,
        text: `Are you sure you want to ${action.toLowerCase()} ${this.user.name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: this.user.banned ? '#3085d6' : '#d33',
        confirmButtonText: `Yes, ${action.toLowerCase()}!`
      }).then((result) => {
        if (result.isConfirmed) {
          this.dataService.toggleBan(this.user!.id).subscribe({
            next: () => {
              this.loadUserProfile(this.user!.id);
              Swal.fire('Updated!', `User has been ${action.toLowerCase()}ned.`, 'success');
            },
            error: () => Swal.fire('Error', 'Failed to update user.', 'error')
          });
        }
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isLoading || !this.isMoreAvailable || this.activeTab !== 'Posts') return;

    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    if (pos >= max - 200) {
      this.loadMore();
    }
  }
}
