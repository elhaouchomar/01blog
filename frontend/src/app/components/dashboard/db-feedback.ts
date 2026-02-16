import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-db-feedback',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './db-feedback.css',
  template: `
    <div *ngIf="type === 'empty'" class="db-feedback db-feedback--empty">
      <div
        class="db-feedback__icon-wrap"
        [style.background-color]="iconColor + '15'"
        [style.color]="iconColor"
      >
        <span class="material-symbols-outlined">{{ icon }}</span>
      </div>
      <h3 class="db-feedback__title">{{ title }}</h3>
      <p class="db-feedback__message">{{ message }}</p>
    </div>

    <div *ngIf="type === 'loading'" class="db-feedback db-feedback--loading">
      <div class="db-feedback__loading-wrap">
        <div class="db-feedback__loader-circle"></div>
        <div class="db-feedback__loader-circle db-feedback__loader-circle--delay-1"></div>
        <div class="db-feedback__loader-circle db-feedback__loader-circle--delay-2"></div>
        <span class="material-symbols-outlined db-feedback__loader-icon">refresh</span>
      </div>
      <p class="db-feedback__loading-label">Synchronizing Platform...</p>
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
