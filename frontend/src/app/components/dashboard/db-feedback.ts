import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-db-feedback',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Empty State -->
    <div *ngIf="type === 'empty'" class="text-center py-5 bg-white border rounded-4 shadow-sm my-4">
      <div class="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center bg-opacity-10" 
           [style.background-color]="iconColor" [style.color]="iconColor" style="width: 80px; height: 80px;">
        <span class="material-symbols-outlined fs-1">{{ icon }}</span>
      </div>
      <h3 class="h5 fw-bold">{{ title }}</h3>
      <p class="text-secondary small mx-auto" style="max-width: 300px;">{{ message }}</p>
    </div>

    <!-- Loading State -->
    <div *ngIf="type === 'loading'" class="text-center py-5 my-4">
      <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-secondary fw-medium">Preparing data...</p>
    </div>
  `
})
export class DbFeedbackComponent {
    @Input() type: 'empty' | 'loading' = 'empty';
    @Input() icon: string = 'inbox';
    @Input() iconColor: string = '#6c757d';
    @Input() title: string = 'No results found';
    @Input() message: string = 'Try adjusting your filters or search terms.';
}
