import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-db-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4 pb-2 border-bottom">
      <div class="d-flex align-items-center gap-3">
        <div *ngIf="titleIcon" class="p-2 rounded-3 d-none d-sm-flex align-items-center justify-content-center border" 
             [style.color]="iconColor" [style.border-color]="iconColor" style="width: 42px; height: 42px; border-style: solid !important; border-width: 1px !important; background-color: rgba(0, 0, 0, 0.05) !important;">
            <span class="material-symbols-outlined fs-3">{{ titleIcon }}</span>
        </div>
        <div>
          <h2 class="h4 fw-bolder mb-1 lh-1">{{ title }}</h2>
          <p class="text-secondary small mb-0">{{ subtitle }}</p>
        </div>
      </div>
      <div class="d-flex gap-2" *ngIf="actionIcon">
        <button class="btn btn-primary d-flex align-items-center justify-content-center gap-2 px-3 shadow-sm rounded-3 fw-bold w-100 w-sm-auto" (click)="onAction.emit()">
          <span class="material-symbols-outlined">{{ actionIcon }}</span>
          {{ actionLabel }}
        </button>
      </div>
    </div>
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
