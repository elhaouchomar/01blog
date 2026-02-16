import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-db-pagination',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './db-pagination.css',
  template: `
    <div class="db-pagination">
      <p class="db-pagination__summary">
        Showing <strong>{{ pagination.getPageStart() }}</strong> -
        <strong>{{ pagination.getPageEnd() }}</strong> of
        <strong>{{ totalItems }}</strong> {{ label }}
      </p>

      <div class="db-pagination__controls">
        <div class="db-pagination__group">
          <button
            class="db-pagination__button"
            [disabled]="pagination.currentPage() === 1"
            (click)="pagination.previousPage()"
            title="Previous Page"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>

          <div class="db-pagination__counter">
            <span class="db-pagination__counter-label">Page</span>
            {{ pagination.currentPage() }}
            <span class="db-pagination__counter-separator">/</span>
            {{ pagination.totalPages() }}
          </div>

          <div class="db-pagination__pages" *ngIf="pagination.totalPages() > 1">
            <button
              *ngFor="let item of visiblePageItems()"
              class="db-pagination__page-btn"
              [class.db-pagination__page-btn--active]="item === pagination.currentPage()"
              [class.db-pagination__page-btn--ellipsis]="item === '...'"
              [disabled]="item === '...'"
              (click)="goTo(item)"
            >
              {{ item }}
            </button>
          </div>

          <button
            class="db-pagination__button"
            [disabled]="pagination.currentPage() === pagination.totalPages()"
            (click)="pagination.nextPage()"
            title="Next Page"
          >
            <span class="material-symbols-outlined">chevron_right</span>
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

  visiblePageItems(): Array<number | string> {
    const total = this.pagination?.totalPages?.() ?? 1;
    const current = this.pagination?.currentPage?.() ?? 1;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }

    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  goTo(item: number | string): void {
    if (typeof item === 'number') {
      this.pagination.goToPage(item);
    }
  }
}
