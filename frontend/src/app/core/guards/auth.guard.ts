import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DataService } from '../services/data.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const dataService = inject(DataService);
    const router = inject(Router);

    // Wait for auth verification to complete
    return toObservable(dataService.authChecked, { injector: dataService.injector }).pipe(
        filter(checked => checked === true),
        take(1),
        map(() => {
            if (dataService.isLoggedIn()) {
                return true;
            }
            router.navigate(['/login']);
            return false;
        })
    );
};
