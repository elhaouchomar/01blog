import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MaterialAlertService } from '../../services/material-alert.service';

@Component({
    selector: 'app-report-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button class="report-btn" (click)="handleReport($event)" [class.icon-only]="iconOnly">
      <span class="material-symbols-outlined">flag</span>
      <span *ngIf="!iconOnly">Report {{ targetType | titlecase }}</span>
    </button>
  `,
    styles: [`
    .report-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border-color, #eee);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .report-btn:hover {
      background: var(--gray-50, #f9f9f9);
      color: var(--error, #dc2626);
      border-color: var(--error, #dc2626);
    }

    .report-btn.icon-only {
      padding: 0.5rem;
      border: none;
    }

    .report-btn.icon-only:hover {
      background: rgba(220, 38, 38, 0.1);
    }

    .material-symbols-outlined {
      font-size: 1.25rem;
    }
  `]
})
export class ReportButtonComponent {
    @Input() targetType: 'post' | 'user' = 'post';
    @Input() targetId!: number;
    @Input() targetName?: string;
    @Input() iconOnly: boolean = false;

    constructor(
        private dataService: DataService,
        private alert: MaterialAlertService
    ) { }

    handleReport(event: Event) {
        event.stopPropagation();

        const title = this.targetType.charAt(0).toUpperCase() + this.targetType.slice(1);
        this.alert.promptReason({
            title: `Report ${title}`,
            subtitle: `Tell us why this ${this.targetType} should be reviewed.`,
            placeholder: 'Describe the issue in detail (required)'
        }).then((reason) => {
            if (!reason) return;

            const reportedUserId = this.targetType === 'user' ? this.targetId : undefined;
            const reportedPostId = this.targetType === 'post' ? this.targetId : undefined;

            this.dataService.reportContent(reason, reportedUserId, reportedPostId).subscribe({
                next: () => {
                    this.alert.fire({
                        icon: 'success',
                        title: 'Reported',
                        text: 'Thank you for your report.',
                        timer: 2000,
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false
                    });
                },
                error: (err) => this.alert.fire('Error', err.error?.message || 'Failed to submit report.', 'error')
            });
        });
    }
}
