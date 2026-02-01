import { Component, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service'; // Import DataService

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-md-row align-items-md-center p-3 bg-white border rounded-4 transition-all hover-shadow mb-3 gap-3"
         [class.bg-light]="report.status === 'RESOLVED'">

      <!-- Content Preview Column -->
      <div class="d-flex align-items-center gap-3 flex-grow-1 min-w-0">
        <div class="rounded-3 border overflow-hidden shadow-sm flex-shrink-0" style="width: 56px; height: 56px; background: #f8f9fa; cursor: pointer;"
             (click)="onViewTarget.emit(report)">
          <img *ngIf="report.reportedPostImage || report.reportedUser?.avatar"
               [src]="report.reportedPostImage || report.reportedUser?.avatar"
               class="w-100 h-100 object-fit-cover">
          <div *ngIf="!report.reportedPostImage && !report.reportedUser?.avatar"
               class="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
            <span class="material-symbols-outlined fs-4">{{ report.reportedPostId ? 'article' : 'person' }}</span>
          </div>
        </div>

        <div class="min-w-0">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge rounded-pill py-1 px-2" style="font-size: 10px;"
                  [style.background-color]="report.reportedPostId ? '#dcfce7' : '#f3e8ff'"
                  [style.color]="report.reportedPostId ? '#198754' : '#6f42c1'">
              {{ report.reportedPostId ? 'POST' : 'USER' }}
            </span>
            <span class="text-secondary d-none d-sm-inline" style="font-size: 11px;">#{{ report.id }}</span>
          </div>
          <h4 class="h6 mb-0 fw-bold text-truncate" style="cursor: pointer;" (click)="onViewTarget.emit(report)">
            {{ report.reportedPostTitle || report.reportedUser?.name || 'Reference Content' }}
          </h4>
          <p class="text-secondary mb-0 text-truncate" style="font-size: 11px;">Flagged by <span class="fw-bold">{{ report.reporter?.name }}</span> • {{ report.createdAt | date:'MMM d' }}</p>
        </div>
      </div>

      <!-- Reason Column (Large screen only) -->
      <div class="px-md-4 border-md-start d-none d-lg-block flex-grow-1" style="max-width: 350px;">
        <p class="mb-0 text-dark fw-medium small line-clamp-2" style="line-height: 1.4;">{{ report.reason }}</p>
      </div>

      <!-- Status Column -->
      <div class="px-md-4 border-md-start align-items-center justify-content-center" style="width: 130px;">
        <span class="badge rounded-pill fw-bold py-2 px-3 w-100"
              [style.background-color]="report.status === 'RESOLVED' ? '#dcfce7' : '#fff7ed'"
              [style.color]="report.status === 'RESOLVED' ? '#198754' : '#fd7e14'">
          {{ report.status.replace('_', ' ') | titlecase }}
        </span>
      </div>

      <!-- Actions Column -->
      <div class="d-flex gap-2 justify-content-end border-top border-md-top-0 border-md-start pt-3 pt-md-0 ps-md-4">
        <!-- Resolve Action Group -->
        <div class="btn-group p-1 bg-light rounded-3 shadow-sm border text-nowrap">
          <button class="btn btn-white btn-sm text-success hover-success-bg rounded-2 d-flex align-items-center px-2 py-1"
                  (click)="onAction.emit({report, action: 'resolve'})" title="Mark as resolved">
            <span class="material-symbols-outlined fs-5">check_circle</span>
          </button>
          
          <ng-container *ngIf="report.reportedPostId">
            <button class="btn btn-white btn-sm rounded-2 d-flex align-items-center px-2 py-1"
                    [style.color]="'#fd7e14'"
                    (click)="onAction.emit({report, action: 'toggleVisibility'})" title="Hide Content">
              <span class="material-symbols-outlined fs-5">cancel</span>
            </button>
            <button class="btn btn-white btn-sm text-danger hover-danger-bg rounded-2 d-flex align-items-center px-2 py-1"
                    (click)="onAction.emit({report, action: 'deletePost'})" title="Delete Post">
              <span class="material-symbols-outlined fs-5">delete</span>
            </button>
          </ng-container>
        </div>

        <!-- User Management Action Group -->
        <ng-container *ngIf="report.reportedUser || report.reportedPostAuthor">
           <div class="vr mx-1 d-none d-md-block"></div>
           <div class="btn-group p-1 bg-light rounded-3 shadow-sm border text-nowrap">
            <button class="btn btn-white btn-sm rounded-2 d-flex align-items-center px-2 py-1"
                    [style.color]="(report.reportedUser || report.reportedPostAuthor).banned ? '#198754' : '#ef4444'"
                    (click)="onAction.emit({report, action: 'banUser'})"
                    [title]="(report.reportedUser || report.reportedPostAuthor).banned ? 'Unban User' : 'Ban User'">
              <span class="material-symbols-outlined fs-5">{{ (report.reportedUser || report.reportedPostAuthor).banned ? 'check_circle' : 'block' }}</span>
            </button>
            <button class="btn btn-white btn-sm text-danger hover-danger-bg rounded-2 d-flex align-items-center px-2 py-1"
                    *ngIf="currentUser?.isAdmin" (click)="onAction.emit({report, action: 'deleteUser'})" title="Purge User Account">
              <span class="material-symbols-outlined fs-5">person_remove</span>
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class ReportCardComponent {
  @Input() report: any;
  @Output() onAction = new EventEmitter<{ report: any, action: string }>();
  @Output() onViewTarget = new EventEmitter<any>();

  currentUser: any = null; // Add currentUser property

  constructor(private dataService: DataService) { // Inject DataService
    effect(() => {
      this.currentUser = this.dataService.currentUser();
    });
  }
}
