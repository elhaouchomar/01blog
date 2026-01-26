import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ModalService } from '../../../services/modal.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  searchQuery = signal('');
  statusFilter = signal('all');
  currentPage = signal(1);
  pageSize = 10;

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

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredUsers().length / this.pageSize) || 1;
  });

  isLoading = computed(() => this.dataService.allUsers().length === 0 && !this.dataService.dashboardStats());

  constructor(public dataService: DataService, public modalService: ModalService) { }

  ngOnInit() {
    if (this.dataService.allUsers().length === 0) {
      this.dataService.loadUsers();
    }
  }

  onSearch(event: any) {
    this.searchQuery.set(event.target.value);
    this.currentPage.set(1); // Reset to page 1 when searching
  }

  setStatusFilter(status: string) {
    this.statusFilter.set(status);
    this.currentPage.set(1); // Reset to page 1 when filtering
  }

  toggleBan(user: any) {
    this.modalService.open('confirm-ban', user);
  }

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      this.dataService.deleteUserAction(user.id).subscribe();
    }
  }

  editUser(user: any) {
    this.modalService.open('admin-edit-user', user);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  getPageStart() {
    if (this.filteredUsers().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  getPageEnd() {
    if (this.filteredUsers().length === 0) return 0;
    return Math.min(this.currentPage() * this.pageSize, this.filteredUsers().length);
  }
}
