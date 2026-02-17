import { Component, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ModalService } from '../../../core/services/modal.service';
import { DbPageHeaderComponent } from '../../../components/dashboard/db-page-header';
import { DbFeedbackComponent } from '../../../components/dashboard/db-feedback';
import { DbPaginationComponent } from '../../../components/dashboard/db-pagination';
import { usePagination } from '../../../shared/utils/pagination.utils';
import { MaterialAlertService } from '../../../core/services/material-alert.service';

@Component({
    selector: 'app-dashboard-reports',
    standalone: true,
    imports: [CommonModule, RouterModule, DbPageHeaderComponent, DbFeedbackComponent, DbPaginationComponent],
    templateUrl: './reports.html',
    styleUrl: './reports.css',
})
export class Reports implements OnInit {
    statusFilter = signal('PENDING');

    filteredReports = computed(() => {
        const reports = this.dataService.reports();
        const filter = this.statusFilter();

        if (filter === 'ALL') return reports;
        return reports.filter(r => r.status === filter);
    });

    pagination = usePagination(() => this.filteredReports(), 6);
    paginatedReports = computed(() => this.pagination.paginatedData());
    emptyStateMessage = computed(() => {
        const stats = this.dataService.dashboardStats();
        if (!stats) return 'Everything is quiet. Communities are behaving well.';
        if (stats.totalUsers === 0 && stats.totalPosts === 0) return 'No users and no posts yet.';
        if (stats.totalUsers === 0) return 'No users yet.';
        if (stats.totalPosts === 0) return 'No posts yet.';
        return 'Everything is quiet. Communities are behaving well.';
    });

    isLoading = computed(() => this.dataService.reports().length === 0 && !this.dataService.dashboardStats());

    constructor(
        public dataService: DataService,
        private modalService: ModalService,
        private alert: MaterialAlertService
    ) {
        effect(() => {
            const totalPages = this.pagination.totalPages();
            if (this.pagination.currentPage() > totalPages) {
                this.pagination.goToPage(totalPages);
            }
        });
    }

    setStatusFilter(status: string) {
        this.statusFilter.set(status);
        this.pagination.goToPage(1);
    }

    ngOnInit() {
        if (this.dataService.reports().length === 0) {
            this.dataService.loadReports();
        }
        if (!this.dataService.dashboardStats()) {
            this.dataService.loadDashboardStats();
        }
    }

    getTargetLabel(report: any): string {
        if (report.reportedPostId) {
            return report.reportedPostTitle || 'No post';
        }
        return report.reportedUser?.name || 'No user';
    }

    getReporterLabel(report: any): string {
        return report.reporter?.name || 'No user';
    }

    updateStatus(report: any, status: string) {
        if (status === 'RESOLVED' || status === 'DISMISSED') {
            this.alert.fire({
                title: `${status === 'RESOLVED' ? 'Resolve' : 'Dismiss'} Report?`,
                text: `Are you sure you want to mark this report as ${status.toLowerCase()}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, proceed',
                cancelButtonColor: '#aaa',
                confirmButtonColor: '#3085d6'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.performUpdate(report.id, status);
                }
            });
        } else {
            this.performUpdate(report.id, status);
        }
    }

    handleReportAction(event: { report: any, action: string }) {
        const { report, action } = event;

        if (action === 'resolve') {
            this.updateStatus(report, 'RESOLVED');
            return;
        }

        const actionConfigs: any = {
            deletePost: {
                title: 'Remove Post?',
                text: 'This will permanently delete the post and resolve the report.',
                exec: () => this.dataService.deletePost(report.reportedPostId)
            },
            deleteUser: {
                title: 'Remove User?',
                text: `This will permanently delete the user account and all their data.`,
                exec: () => this.dataService.deleteUserAction((report.reportedUser || report.reportedPostAuthor).id)
            },
            banUser: {
                title: 'Ban User?',
                text: `Are you sure you want to ban ${(report.reportedUser || report.reportedPostAuthor).name}?`,
                exec: () => this.dataService.toggleBan((report.reportedUser || report.reportedPostAuthor).id)
            },
            toggleVisibility: {
                title: 'Toggle Visibility?',
                text: 'Change whether this post is visible to other users.',
                exec: () => this.dataService.togglePostVisibility(report.reportedPostId)
            }
        };

        const config = actionConfigs[action];
        if (!config) return;

        this.alert.fire({
            title: config.title,
            text: config.text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, execute'
        }).then((result) => {
            if (result.isConfirmed) {
                config.exec().subscribe({
                    next: () => {
                        this.performUpdate(report.id, 'RESOLVED');
                        this.alert.fire('Action Complete', 'The entity was managed and the report resolved.', 'success');
                    },
                    error: (err: any) => this.alert.fire('Error', 'Failed to complete action: ' + (err.error?.message || 'Server error'), 'error')
                });
            }
        });
    }

    private performUpdate(id: number, status: string) {
        this.dataService.updateReportStatus(id, status).subscribe({
            next: () => {
                this.alert.fire({
                    position: 'top-end',
                    icon: 'success',
                    title: `Report ${status.toLowerCase()}`,
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true
                });
            }
        });
    }

    handleView(report: any) {
        if (report.reportedPostId) {
            this.viewPost(report.reportedPostId);
        } else if (report.reportedUser) {
            window.open(`/profile/${report.reportedUser.id}`, '_blank');
        }
    }

    viewPost(postId: number) {
        this.dataService.getPost(postId).subscribe({
            next: (post) => {
                this.modalService.open('post-details', post);
            },
            error: (err) => console.error('Error loading post:', err)
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'UNDER_REVIEW': return 'status-review';
            case 'RESOLVED': return 'status-resolved';
            case 'DISMISSED': return 'status-dismissed';
            default: return '';
        }
    }

    formatStatus(status: string): string {
        return status?.replace(/_/g, ' ') || '';
    }
}
