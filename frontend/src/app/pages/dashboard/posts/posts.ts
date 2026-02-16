import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ModalService } from '../../../services/modal.service';
import { DbPageHeaderComponent } from '../../../components/dashboard/db-page-header';
import { DbFeedbackComponent } from '../../../components/dashboard/db-feedback';
import { DbPaginationComponent } from '../../../components/dashboard/db-pagination';
import { usePagination } from '../../../utils/pagination.utils';
import { MaterialAlertService } from '../../../services/material-alert.service';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DbPageHeaderComponent, DbFeedbackComponent, DbPaginationComponent],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts implements OnInit {
  searchQuery = signal('');
  statusFilter = signal('visible');
  sortBy = signal('newest');

  filteredPosts = computed(() => {
    let filtered = [...this.dataService.managementPosts()];
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    // Status filter
    if (status === 'visible') {
      filtered = filtered.filter(p => !p.hidden);
    } else if (status === 'hidden') {
      filtered = filtered.filter(p => p.hidden);
    }

    // Search filter
    if (query) {
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.user?.name?.toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      if (this.sortBy() === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (this.sortBy() === 'most-liked') {
        return (b.likes || 0) - (a.likes || 0);
      }
      return 0;
    });

    return filtered;
  });

  pagination = usePagination(() => this.filteredPosts(), 6);
  paginatedPosts = computed(() => this.pagination.paginatedData());

  isLoading = computed(() => this.dataService.managementPosts().length === 0 && !this.dataService.dashboardStats());

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    private alert: MaterialAlertService
  ) {
    effect(() => {
      const totalPages = this.pagination.totalPages();
      if (this.pagination.currentPage() > totalPages) {
        this.pagination.goToPage(totalPages);
      }
    });
  }

  ngOnInit() {
    if (this.dataService.managementPosts().length === 0) {
      this.dataService.loadManagementPosts();
    }
  }

  onFilterChange() {
    this.pagination.goToPage(1);
  }

  setSearchQuery(value: string) {
    this.searchQuery.set(value);
    this.pagination.goToPage(1);
  }

  setStatusFilter(value: string) {
    this.statusFilter.set(value);
    this.pagination.goToPage(1);
  }

  setSortBy(value: string) {
    this.sortBy.set(value);
    this.pagination.goToPage(1);
  }

  reviewPost(post: any) {
    this.modalService.open('post-details', post);
  }

  togglePostVisibility(post: any) {
    const action = post.hidden ? 'unhide' : 'hide';
    this.alert.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Post?`,
      text: `Are you sure you want to ${action} "${post.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${action} it!`
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.togglePostVisibility(post.id).subscribe({
          next: () => {
            this.alert.fire({
              position: 'top-end',
              icon: 'success',
              title: `Post ${action}d`,
              showConfirmButton: false,
              timer: 1500,
              toast: true
            });
          },
          error: (err) => {
            this.alert.fire('Error', `Failed to ${action} post.`, 'error');
          }
        });
      }
    });
  }

  deletePost(post: any) {
    this.alert.fire({
      title: 'Delete Post?',
      text: `Are you sure you want to delete "${post.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.deletePost(post.id).subscribe({
          next: () => {
            this.alert.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Post deleted',
              showConfirmButton: false,
              timer: 1500,
              toast: true
            });
          },
          error: (err) => {
            this.alert.fire('Error', 'Failed to delete post.', 'error');
          }
        });
      }
    });
  }

  toggleBan(user: any) {
    const action = user.banned ? 'Unban' : 'Ban';
    this.alert.fire({
      title: `${action} Author?`,
      text: `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: user.banned ? '#3085d6' : '#d33',
      cancelButtonColor: '#aaa',
      confirmButtonText: `Yes, ${action.toLowerCase()}!`
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.toggleBan(user.id).subscribe({
          next: () => {
            this.alert.fire('Updated!', `Author status has been updated.`, 'success');
          },
          error: (err: any) => {
            this.alert.fire('Error', err.error?.message || 'Failed to update user.', 'error');
          }
        });
      }
    });
  }

  deleteUser(user: any) {
    this.alert.fire({
      title: 'Delete Author Account?',
      text: `Are you sure you want to delete ${user.name}? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.deleteUserAction(user.id).subscribe({
          next: () => {
            this.alert.fire('Deleted!', 'User account has been removed.', 'success');
          },
          error: (err: any) => {
            this.alert.fire('Error', err.error?.message || 'Failed to delete user.', 'error');
          }
        });
      }
    });
  }

  exportPosts() {
    console.log('Exporting posts...');
  }
}
