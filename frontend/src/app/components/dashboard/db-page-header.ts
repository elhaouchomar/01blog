import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-db-page-header',
  standalone: true,
  imports: [CommonModule],
  styleUrl: './db-page-header.css',
  template: `
    <header class="db-page-header">
      <div class="db-page-header__main">
        <div
          *ngIf="titleIcon"
          class="db-page-header__icon"
          [style.color]="iconColor"
          [style.border-color]="iconColor"
          [style.background-color]="iconColor + '14'"
        >
          <span class="material-symbols-outlined">{{ titleIcon }}</span>
        </div>
        <div class="db-page-header__text">
          <h2 class="db-page-header__title">{{ title }}</h2>
          <p class="db-page-header__subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <div class="db-page-header__actions" *ngIf="actionIcon">
        <button class="db-page-header__action-btn" (click)="onAction.emit()">
          <span class="material-symbols-outlined">{{ actionIcon }}</span>
          {{ actionLabel }}
        </button>
      </div>
    </header>
  `
})
export class DbPageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() titleIcon: string = '';
  @Input() iconColor: string = '#0d6efd';
  @Input() actionIcon: string = '';
  @Input() actionLabel: string = '';
  @Output() onAction = new EventEmitter<void>();
}
