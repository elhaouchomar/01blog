import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { REPORT_REASONS } from '../../../shared/constants/report-reasons.data';

export interface ReportReasonDialogData {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    minLength?: number;
    maxLength?: number;
    confirmButtonText?: string;
}

@Component({
    selector: 'app-report-reason-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
    templateUrl: './report-reason-dialog.component.html',
    styleUrl: './report-reason-dialog.component.css'
})
export class ReportReasonDialogComponent {
    reasons = REPORT_REASONS;
    selectedReason = '';
    reason = '';
    error = '';
    readonly minLength: number;
    readonly maxLength: number;

    constructor(
        private dialogRef: MatDialogRef<ReportReasonDialogComponent, string | null>,
        @Inject(MAT_DIALOG_DATA) public data: ReportReasonDialogData
    ) {
        this.minLength = data.minLength ?? 10;
        this.maxLength = data.maxLength ?? 500;
    }

    selectReason(reason: string) {
        this.selectedReason = reason;
        this.error = '';
        if (reason !== 'Other') {
            this.reason = '';
        }
    }

    submit() {
        let finalReason = '';
        if (this.selectedReason === 'Other') {
            const trimmed = this.reason.trim();
            if (trimmed.length < this.minLength || trimmed.length > this.maxLength) {
                this.error = `Please provide more details (between ${this.minLength} and ${this.maxLength} characters).`;
                return;
            }
            finalReason = trimmed;
        } else if (this.selectedReason) {
            finalReason = this.selectedReason;
        } else {
            this.error = 'Please select a reason.';
            return;
        }
        this.close(finalReason);
    }

    close(value: string | null) {
        this.dialogRef.close(value);
    }
}
