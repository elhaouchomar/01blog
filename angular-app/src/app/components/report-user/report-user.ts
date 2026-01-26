import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-report-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-user.html',
  styleUrl: './report-user.css'
})
export class ReportUser implements OnInit {
  user: any = null;
  selectedReason = 'Spam or bot';
  details = '';
  isSubmitting = false;

  reasons = [
    'Spam or bot',
    'Inappropriate content',
    'Abusive or hateful',
    'Harassment',
    'Impersonation',
    'Other'
  ];

  constructor(
    protected modalService: ModalService,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.user = this.modalService.modalData();
  }

  submitReport() {
    if (!this.user || !this.selectedReason) return;

    this.isSubmitting = true;
    const finalReason = this.details ? `${this.selectedReason}: ${this.details}` : this.selectedReason;

    this.dataService.reportContent(finalReason, this.user.id).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.modalService.open('success');
      },
      error: (err) => {
        console.error('Error reporting user:', err);
        this.isSubmitting = false;
        alert('Failed to submit report. Please try again.');
      }
    });
  }

  close() {
    this.modalService.close();
  }
}
