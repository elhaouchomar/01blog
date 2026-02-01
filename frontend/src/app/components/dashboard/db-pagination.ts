import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-db-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center mt-4 gap-3 border-top pt-4">
      <p class="text-secondary small mb-0 order-2 order-sm-1">
        Showing <span class="fw-bold text-dark">{{ pagination.getPageStart() }}</span> - 
        <span class="fw-bold text-dark">{{ pagination.getPageEnd() }}</span> of 
        <span class="fw-bold text-dark">{{ totalItems }}</span> {{ label }}
      </p>
      
      <div class="d-flex align-items-center gap-2 order-1 order-sm-2">
        <div class="btn-group shadow-sm rounded-3 overflow-hidden">
          <button class="btn btn-white btn-sm d-flex align-items-center px-3 border" 
                  [disabled]="pagination.currentPage() === 1" 
                  (click)="pagination.previousPage()"
                  title="Previous Page">
            <span class="material-symbols-outlined fs-5">chevron_left</span>
          </button>
          
          <div class="btn btn-white btn-sm fw-bold border-top border-bottom px-4 d-flex align-items-center bg-light">
            <span class="d-none d-md-inline me-1">Page</span> {{ pagination.currentPage() }} 
            <span class="mx-1 text-muted" style="color: #6c757d;">/</span> {{ pagination.totalPages() }}
          </div>
          
          <button class="btn btn-white btn-sm d-flex align-items-center px-3 border" 
                  [disabled]="pagination.currentPage() === pagination.totalPages()" 
                  (click)="pagination.nextPage()"
                  title="Next Page">
            <span class="material-symbols-outlined fs-5">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class DbPaginationComponent {
  @Input() pagination: any;
  @Input() totalItems: number = 0;
  @Input() label: string = 'items';
}
