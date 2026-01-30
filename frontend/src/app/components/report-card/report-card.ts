import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-wrap align-items-center p-3 bg-white border rounded-4 transition-all hover-shadow mb-3" 
         [class.opacity-50]="report.status === 'RESOLVED'"
         [class.bg-light]="report.status === 'RESOLVED'">
      
      <!-- Content Preview Column -->
      <div class="d-flex align-items-center gap-3 flex-grow-1 min-w-200">
        <div class="rounded-3 border overflow-hidden shadow-sm" style="width: 56px; height: 56px; background: #f8f9fa; cursor: pointer;"
             (click)="onViewTarget.emit(report)">
          <img *ngIf="report.reportedPostImage || report.reportedUser?.avatar" 
               [src]="report.reportedPostImage || report.reportedUser?.avatar" 
               class="w-100 h-100 object-fit-cover">
          <div *ngIf="!report.reportedPostImage && !report.reportedUser?.avatar" 
               class="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-50">
            <span class="material-symbols-outlined fs-4">{{ report.reportedPostId ? 'article' : 'person' }}</span>
          </div>
        </div>
        
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge rounded-pill bg-opacity-10 py-1 px-2" style="font-size: 10px;"
                  [class.bg-primary.text-primary]="report.reportedPostId"
                  [class.bg-purple.text-purple]="!report.reportedPostId">
              {{ report.reportedPostId ? 'POST' : 'USER' }}
            </span>
            <span class="text-secondary" style="font-size: 11px;">#{{ report.id }}</span>
          </div>
          <h4 class="h6 mb-0 fw-bold" style="cursor: pointer;" (click)="onViewTarget.emit(report)">
            {{ report.reportedPostTitle || report.reportedUser?.name || 'Reference Content' }}
          </h4>
          <p class="text-secondary mb-0" style="font-size: 12px;">Flagged by <span class="fw-bold">{{ report.reporter?.name }}</span> • {{ report.createdAt | date:'MMM d' }}</p>
        </div>
      </div>

      <!-- Reason Column -->
      <div class="px-4 border-start d-none d-lg-block flex-grow-1" style="max-width: 400px;">
        <p class="mb-0 text-dark fw-medium small" style="line-height: 1.4;">{{ report.reason }}</p>
      </div>

      <!-- Status Column -->
      <div class="px-4 border-start d-none d-md-flex align-items-center" style="width: 140px;">
        <span class="badge rounded-pill fw-bold py-2 px-3 w-100" 
              [class.bg-warning.text-warning]="report.status !== 'RESOLVED'" 
              [class.bg-success.text-success]="report.status === 'RESOLVED'"
              [class.bg-opacity-10]="true">
          {{ report.status.replace('_', ' ') | titlecase }}
        </span>
      </div>

      <!-- Actions Column -->
      <div class="d-flex gap-2 ms-auto border-start ps-4">
        <!-- Common Resolve -->
        <button class="btn btn-light btn-sm text-success hover-success-bg rounded-3 p-2" 
                (click)="onAction.emit({report, action: 'resolve'})" title="Mark as resolved">
          <span class="material-symbols-outlined fs-5">check_circle</span>
        </button>

        <!-- Post Specific -->
        <ng-container *ngIf="report.reportedPostId">
           <button class="btn btn-light btn-sm text-danger hover-danger-bg rounded-3 p-2" 
                   (click)="onAction.emit({report, action: 'deletePost'})" title="Remove Post">
            <span class="material-symbols-outlined fs-5">delete</span>
          </button>
        </ng-container>

        <!-- User Specific -->
        <ng-container *ngIf="report.reportedUser">
          <button class="btn btn-light btn-sm rounded-3 p-2" 
                  [class.text-danger]="!report.reportedUser.banned" 
                  [class.text-success]="report.reportedUser.banned"
                  (click)="onAction.emit({report, action: 'banUser'})" 
                  [title]="report.reportedUser.banned ? 'Unban User' : 'Ban User'">
            <span class="material-symbols-outlined fs-5">block</span>
          </button>
          <button class="btn btn-light btn-sm text-danger hover-danger-bg rounded-3 p-2" 
                  (click)="onAction.emit({report, action: 'deleteUser'})" title="Permanently Remove User">
            <span class="material-symbols-outlined fs-5">person_remove</span>
          </button>
        </ng-container>
      </div>
    </div>
  `
})
export class ReportCardComponent {
  @Input() report: any;
  @Output() onAction = new EventEmitter<{ report: any, action: string }>();
  @Output() onViewTarget = new EventEmitter<any>();
}
