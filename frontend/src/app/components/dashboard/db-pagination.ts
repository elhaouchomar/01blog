import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-db-pagination',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
      <p class="text-secondary small mb-0">
        Showing {{ pagination.getPageStart() }} - {{ pagination.getPageEnd() }} of {{ totalItems }} {{ label }}
      </p>
      <div class="btn-group shadow-sm">
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 border-opacity-25" 
                [disabled]="pagination.currentPage() === 1" 
                (click)="pagination.previousPage()">
          <span class="material-symbols-outlined fs-6 text-primary">chevron_left</span>
          Previous
        </button>
        <span class="btn btn-light btn-sm fw-bold border-secondary border-opacity-25 px-3">
          Page {{ pagination.currentPage() }} of {{ pagination.totalPages() }}
        </span>
        <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 border-opacity-25" 
                [disabled]="pagination.currentPage() === pagination.totalPages()" 
                (click)="pagination.nextPage()">
          Next
          <span class="material-symbols-outlined fs-6 text-primary">chevron_right</span>
        </button>
      </div>
    </div>
  `
})
export class DbPaginationComponent {
    @Input() pagination: any;
    @Input() totalItems: number = 0;
    @Input() label: string = 'items';
}
