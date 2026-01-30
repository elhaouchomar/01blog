import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ModalService } from '../../../services/modal.service';
import { usePagination } from '../../../utils/pagination.utils';
import { DbPageHeaderComponent } from '../../../components/dashboard/db-page-header';
import { DbPaginationComponent } from '../../../components/dashboard/db-pagination';
import { DbFeedbackComponent } from '../../../components/dashboard/db-feedback';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DbPageHeaderComponent, DbPaginationComponent, DbFeedbackComponent],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts implements OnInit {
  searchQuery = signal('');
  statusFilter = signal('');
  sortBy = signal('newest');

  filteredPosts = computed(() => {
    let filtered = [...this.dataService.posts()];
    const query = this.searchQuery().toLowerCase();

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

  // Use standardized pagination logic
  pagination = usePagination(this.filteredPosts);

  isLoading = computed(() => this.dataService.posts().length === 0 && !this.dataService.dashboardStats());

  constructor(public dataService: DataService, public modalService: ModalService) { }

  ngOnInit() {
    if (this.dataService.posts().length === 0) {
      this.dataService.loadPosts();
    }
  }

  onFilterChange() {
    this.pagination.goToPage(1); // Reset to page 1 using utility
  }

  reviewPost(post: any) {
    this.modalService.open('post-details', post);
  }

  deletePost(post: any) {
    Swal.fire({
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
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Post deleted',
              showConfirmButton: false,
              timer: 1500,
              toast: true
            });
          },
          error: (err) => {
            Swal.fire('Error', 'Failed to delete post.', 'error');
          }
        });
      }
    });
  }

  exportPosts() {
    console.log('Exporting posts...');
  }
}
