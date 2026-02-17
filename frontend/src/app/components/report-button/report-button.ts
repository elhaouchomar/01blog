import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';
import { MaterialAlertService } from '../../core/services/material-alert.service';

@Component({
  selector: 'app-report-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-button.component.html',
  styleUrl: './report-button.component.css'
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
