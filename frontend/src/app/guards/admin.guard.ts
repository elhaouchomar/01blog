import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DataService } from '../services/data.service';
import { map, take, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const adminGuard: CanActivateFn = (route, state) => {
    const dataService = inject(DataService);
    const router = inject(Router);

    // Wait for auth verification to complete
    return toObservable(dataService.authChecked, { injector: dataService.injector }).pipe(
        filter(checked => checked === true),
        take(1),
        map(() => {
            const user = dataService.getCurrentUser();
            if (user && user.role === 'ADMIN') {
                return true;
            }
            router.navigate(['/404']);
            return false;
        })
    );
};
