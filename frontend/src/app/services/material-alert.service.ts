import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MaterialAlertDialogComponent, MaterialAlertDialogData } from './material-alert-dialog.component';
import { ReportReasonDialogComponent, ReportReasonDialogData } from './report-reason-dialog.component';

type MaterialAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';
type MaterialAlertPosition =
    | 'top-start'
    | 'top'
    | 'top-end'
    | 'bottom-start'
    | 'bottom'
    | 'bottom-end';

interface MaterialAlertOptions extends MaterialAlertDialogData {
    toast?: boolean;
    timer?: number;
    position?: MaterialAlertPosition;
    allowOutsideClick?: boolean;
}

interface MaterialAlertResult {
    isConfirmed: boolean;
    isDismissed: boolean;
}

interface ReportReasonOptions extends ReportReasonDialogData {
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

        if (options.toast || options.timer) {
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

        const ref = this.dialog.open(MaterialAlertDialogComponent, {
            data: options,
            disableClose: options.allowOutsideClick === false,
            autoFocus: false,
            width: '420px'
        });

        return new Promise((resolve) => {
            ref.afterClosed().subscribe((confirmed) => {
                resolve({
                    isConfirmed: !!confirmed,
                    isDismissed: !confirmed
                });
            });
        });
    }

    promptReason(options?: ReportReasonOptions): Promise<string | null> {
        const ref = this.dialog.open(ReportReasonDialogComponent, {
            data: options || {},
            disableClose: true,
            autoFocus: false,
            width: '460px'
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
