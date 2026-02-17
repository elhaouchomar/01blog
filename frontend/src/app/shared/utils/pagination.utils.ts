import { signal, computed, WritableSignal } from '@angular/core';
import { APP_CONSTANTS } from '../constants/app.constants';

export interface PaginationState<T> {
    currentPage: WritableSignal<number>;
    pageSize: number;
    paginatedData: any; // Computed
    totalPages: any; // Computed
    nextPage: () => void;
    previousPage: () => void;
    getPageStart: () => number;
    getPageEnd: () => number;
    goToPage: (page: number) => void;
}

export function usePagination<T>(dataSource: () => T[], pageSize: number = APP_CONSTANTS.PAGINATION.PAGE_SIZE) {
    const currentPage = signal(1);

    const totalPages = computed(() => {
        const data = dataSource();
        const total = Math.ceil(data.length / pageSize) || 1;
        return total;
    });

    const paginatedData = computed(() => {
        const data = dataSource();
        const start = (currentPage() - 1) * pageSize;
        const end = start + pageSize;
        return data.slice(start, end);
    });

    const nextPage = () => {
        if (currentPage() < totalPages()) {
            currentPage.update(p => p + 1);
        }
    };

    const previousPage = () => {
        if (currentPage() > 1) {
            currentPage.update(p => p - 1);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages()) {
            currentPage.set(page);
        }
    };

    const getPageStart = computed(() => {
        const data = dataSource();
        if (data.length === 0) return 0;
        return (currentPage() - 1) * pageSize + 1;
    });

    const getPageEnd = computed(() => {
        const data = dataSource();
        if (data.length === 0) return 0;
        return Math.min(currentPage() * pageSize, data.length);
    });

    return {
        currentPage,
        pageSize,
        paginatedData,
        totalPages,
        nextPage,
        previousPage,
        goToPage,
        getPageStart,
        getPageEnd
    };
}
