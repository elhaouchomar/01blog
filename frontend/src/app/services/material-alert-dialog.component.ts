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
    template: `
    <section class="alert-shell" [ngClass]="typeClass">
      <h2 mat-dialog-title class="dialog-title">
        <span class="icon-badge" [ngClass]="typeClass">
          <mat-icon>{{ iconName }}</mat-icon>
        </span>
        <span>{{ data.title || defaultTitle }}</span>
      </h2>

      <mat-dialog-content class="dialog-content">
        <p *ngIf="data.text">{{ data.text }}</p>
        <div *ngIf="data.html" [innerHTML]="data.html"></div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button
          mat-button
          class="cancel-button"
          *ngIf="data.showCancelButton"
          [ngStyle]="cancelButtonStyle"
          (click)="close(false)"
        >
          {{ data.cancelButtonText || 'Cancel' }}
        </button>
        <button
          mat-flat-button
          class="confirm-button"
          *ngIf="data.showConfirmButton !== false"
          [ngStyle]="confirmButtonStyle"
          (click)="close(true)"
        >
          {{ data.confirmButtonText || 'OK' }}
        </button>
      </mat-dialog-actions>
    </section>
  `,
    styles: [`
    :host {
      display: block;
    }

    .alert-shell {
      border-radius: 14px;
      background: #ffffff;
      border: 1px solid #dbe3ea;
      border-top-width: 4px;
      border-top-color: #2563eb;
      padding: 0.25rem 0.5rem;
    }

    .alert-shell.success { border-top-color: #16a34a; }
    .alert-shell.error { border-top-color: #dc2626; }
    .alert-shell.warning { border-top-color: #d97706; }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin: 0;
      font-weight: 700;
      color: #0f172a;
    }

    .icon-badge {
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      background: #e0edff;
      color: #1d4ed8;
    }

    .icon-badge.success { background: #dcfce7; color: #166534; }
    .icon-badge.error { background: #fee2e2; color: #991b1b; }
    .icon-badge.warning { background: #ffedd5; color: #9a3412; }

    .dialog-content {
      color: #334155;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      padding-top: 0.15rem;
    }

    .dialog-content p {
      margin: 0;
    }

    .dialog-actions {
      gap: 0.5rem;
      padding-top: 0.15rem;
    }

    .confirm-button,
    .cancel-button {
      min-width: 86px;
      border-radius: 9px;
      font-weight: 600;
    }

    .cancel-button {
      border: 1px solid #cbd5e1;
      color: #334155;
    }

    .confirm-button {
      color: #ffffff;
      background: #1d4ed8;
    }

    .alert-shell.success .confirm-button { background: #15803d; }
    .alert-shell.error .confirm-button { background: #b91c1c; }
    .alert-shell.warning .confirm-button { background: #b45309; }
  `]
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
