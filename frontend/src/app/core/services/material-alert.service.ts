import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MaterialAlertDialogComponent, MaterialAlertDialogData } from '../../components/modals/material-alert-dialog/material-alert-dialog.component';
import { ReportReasonDialogComponent, ReportReasonDialogData } from '../../components/modals/report-reason-dialog/report-reason-dialog.component';

export type MaterialAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';
export type MaterialAlertPosition =
    | 'top-start'
    | 'top'
    | 'top-end'
    | 'bottom-start'
    | 'bottom'
    | 'bottom-end';

export interface MaterialAlertOptions extends MaterialAlertDialogData {
    toast?: boolean;
    timer?: number;
    position?: MaterialAlertPosition;
    allowOutsideClick?: boolean;
}

export interface MaterialAlertResult {
    isConfirmed: boolean;
    isDismissed: boolean;
}

export interface ReportReasonOptions extends ReportReasonDialogData {
}

const TOAST_POSITIONS: Record<MaterialAlertPosition, {
    horizontal: MatSnackBarHorizontalPosition;
    vertical: MatSnackBarVerticalPosition;
}> = {
    'top-start': { horizontal: 'start', vertical: 'top' },
    top: { horizontal: 'center', vertical: 'top' },
    'top-end': { horizontal: 'end', vertical: 'top' },
    'bottom-start': { horizontal: 'start', vertical: 'bottom' },
    bottom: { horizontal: 'center', vertical: 'bottom' },
    'bottom-end': { horizontal: 'end', vertical: 'bottom' }
};

@Injectable({
    providedIn: 'root'
})
export class MaterialAlertService {
    private activeDialogPromise: Promise<MaterialAlertResult> | null = null;
    private lastToastKey = '';
    private lastToastAt = 0;

    constructor(
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {
        (window as any).__materialSwalFire = this.fire.bind(this);
    }

    fire(
        arg1?: string | MaterialAlertOptions,
        arg2?: string,
        arg3?: MaterialAlertIcon
    ): Promise<MaterialAlertResult> {
        const options = this.normalizeArgs(arg1, arg2, arg3);
        const messageKey = `${options.icon || 'info'}|${options.title || ''}|${options.text || ''}`;

        if (options.toast || options.timer) {
            const now = Date.now();
            if (this.lastToastKey === messageKey && now - this.lastToastAt < 1800) {
                return Promise.resolve({ isConfirmed: false, isDismissed: true });
            }
            this.lastToastKey = messageKey;
            this.lastToastAt = now;

            const message = options.title || options.text || 'Done';
            const duration = options.timer ?? 2500;
            const position = TOAST_POSITIONS[options.position || 'top-end'];

            this.snackBar.open(message, 'OK', {
                duration,
                horizontalPosition: position.horizontal,
                verticalPosition: position.vertical,
                panelClass: ['material-alert-toast', `material-alert-toast--${options.icon || 'info'}`]
            });

            return Promise.resolve({ isConfirmed: true, isDismissed: false });
        }

        if (this.activeDialogPromise) {
            return this.activeDialogPromise;
        }

        const ref = this.dialog.open(MaterialAlertDialogComponent, {
            data: options,
            disableClose: options.allowOutsideClick === false,
            autoFocus: false,
            width: '420px',
            maxWidth: '92vw',
            panelClass: 'material-alert-dialog-panel'
        });

        this.activeDialogPromise = new Promise((resolve) => {
            ref.afterClosed().subscribe((confirmed) => {
                this.activeDialogPromise = null;
                resolve({
                    isConfirmed: !!confirmed,
                    isDismissed: !confirmed
                });
            });
        });

        return this.activeDialogPromise;
    }

    promptReason(options?: ReportReasonOptions): Promise<string | null> {
        const ref = this.dialog.open(ReportReasonDialogComponent, {
            data: options || {},
            disableClose: true,
            autoFocus: false,
            width: '460px',
            maxWidth: '92vw',
            panelClass: 'report-reason-dialog-panel'
        });

        return new Promise((resolve) => {
            ref.afterClosed().subscribe((value) => {
                if (typeof value === 'string' && value.trim().length > 0) {
                    resolve(value.trim());
                } else {
                    resolve(null);
                }
            });
        });
    }

    private normalizeArgs(
        arg1?: string | MaterialAlertOptions,
        arg2?: string,
        arg3?: MaterialAlertIcon
    ): MaterialAlertOptions {
        if (typeof arg1 === 'string') {
            return {
                title: arg1,
                text: arg2,
                icon: arg3
            };
        }

        return arg1 || {};
    }
}
