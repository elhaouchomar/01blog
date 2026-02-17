import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ModalService } from '../../../core/services/modal.service';
import { DbPageHeaderComponent } from '../../../components/dashboard/db-page-header';
import { DbFeedbackComponent } from '../../../components/dashboard/db-feedback';
import { DbPaginationComponent } from '../../../components/dashboard/db-pagination';
import { usePagination } from '../../../shared/utils/pagination.utils';
import { MaterialAlertService } from '../../../core/services/material-alert.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DbPageHeaderComponent, DbFeedbackComponent, DbPaginationComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  searchQuery = signal('');
  statusFilter = signal('all');

  filteredUsers = computed(() => {
    let filtered = [...this.dataService.allUsers()];
    const query = this.searchQuery().toLowerCase();
    const status = this.statusFilter();

    // Exclude current admin
    const currentAdminId = this.dataService.currentUser()?.id;
    filtered = filtered.filter(u => u.id !== currentAdminId);

    // Search filter
    if (query) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.role?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'banned') {
        filtered = filtered.filter(u => u.banned === true);
      } else if (status === 'active') {
        filtered = filtered.filter(u => u.banned !== true);
      } else if (status === 'admins') {
        filtered = filtered.filter(u => u.role === 'ADMIN');
      }
    }

    return filtered;
  });

  pagination = usePagination(() => this.filteredUsers(), 8);
  paginatedUsers = computed(() => this.pagination.paginatedData());

  isLoading = computed(() => this.dataService.allUsers().length === 0 && !this.dataService.dashboardStats());

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    public router: Router,
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
    if (this.dataService.allUsers().length === 0) {
      this.dataService.loadUsers();
    }
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    this.pagination.goToPage(1);
  }

  setStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.pagination.goToPage(1);
  }

  toggleBan(user: any) {
    const action = user.banned ? 'Unban' : 'Ban';
    this.alert.fire({
      title: `${action} User?`,
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
            this.alert.fire(
              'Updated!',
              `User has been ${user.banned ? 'unbanned' : 'banned'}.`,
              'success'
            );
          },
          error: (err: any) => {
            const errorMessage = err.error?.message || 'Failed to update user status.';
            this.alert.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }

  deleteUser(user: any) {
    this.alert.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.deleteUserAction(user.id).subscribe({
          next: () => {
            this.alert.fire(
              'Deleted!',
              'User has been deleted.',
              'success'
            );
          },
          error: (err) => {
            const errorMessage = err.error?.message || 'Failed to delete user.';
            this.alert.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }

  editUser(user: any) {
    this.modalService.open('admin-edit-user', user);
  }
}
