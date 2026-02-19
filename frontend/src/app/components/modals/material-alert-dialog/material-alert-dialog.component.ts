import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface MaterialAlertDialogData {
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
    title?: string;
    text?: string;
    html?: string;
    confirmButtonText?: string;
    confirmButtonColor?: string;
    cancelButtonText?: string;
    cancelButtonColor?: string;
    showCancelButton?: boolean;
    showConfirmButton?: boolean;
}

const ICON_MAP = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
    question: 'help'
} as const;

@Component({
    selector: 'app-material-alert-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './material-alert-dialog.component.html',
    styleUrl: './material-alert-dialog.component.css'
})
export class MaterialAlertDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<MaterialAlertDialogComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) public data: MaterialAlertDialogData
    ) { }

    get typeClass(): NonNullable<MaterialAlertDialogData['icon']> {
        return this.data.icon || 'info';
    }

    get iconName(): string {
        return ICON_MAP[this.typeClass];
    }

    get defaultTitle(): string {
        return this.typeClass === 'error' ? 'Error' : 'Notice';
    }

    get impactText(): string {
        if (this.typeClass === 'error') return 'Please review carefully before continuing.';
        if (this.typeClass === 'warning') return 'This operation may have visible impact for users.';
        if (this.typeClass === 'success') return 'Everything looks good. You can continue.';
        return 'Confirm to proceed with this action.';
    }

    get confirmIcon(): string {
        if (this.typeClass === 'warning' || this.typeClass === 'error') return 'task_alt';
        return 'check';
    }

    get confirmButtonStyle(): Record<string, string> {
        return this.data.confirmButtonColor
            ? { background: this.data.confirmButtonColor, color: '#ffffff' }
            : {};
    }

    get cancelButtonStyle(): Record<string, string> {
        return this.data.cancelButtonColor
            ? { color: this.data.cancelButtonColor, borderColor: this.data.cancelButtonColor }
            : {};
    }

    close(confirmed: boolean) {
        this.dialogRef.close(confirmed);
    }
}
