import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ModalService } from '../../../services/modal.service';
import { usePagination } from '../../../utils/pagination.utils';
import { DbPageHeaderComponent } from '../../../components/dashboard/db-page-header';
import { DbPaginationComponent } from '../../../components/dashboard/db-pagination';
import { DbFeedbackComponent } from '../../../components/dashboard/db-feedback';
import { ReportCardComponent } from '../../../components/report-card/report-card';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-dashboard-reports',
    standalone: true,
    imports: [CommonModule, RouterModule, ReportCardComponent, DbPageHeaderComponent, DbPaginationComponent, DbFeedbackComponent],
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

    // Use standardized pagination logic
    pagination = usePagination(this.filteredReports);

    isLoading = computed(() => this.dataService.reports().length === 0 && !this.dataService.dashboardStats());

    constructor(public dataService: DataService, private modalService: ModalService) { }

    setStatusFilter(status: string) {
        this.statusFilter.set(status);
        this.pagination.goToPage(1);
    }

    ngOnInit() {
        if (this.dataService.reports().length === 0) {
            this.dataService.loadReports();
        }
    }

    updateStatus(report: any, status: string) {
        if (status === 'RESOLVED' || status === 'DISMISSED') {
            Swal.fire({
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
                text: 'This will permanently delete the user account and all their data.',
                exec: () => this.dataService.deleteUserAction(report.reportedUser.id)
            },
            banUser: {
                title: 'Ban User?',
                text: `Are you sure you want to ban ${report.reportedUser.name}?`,
                exec: () => this.dataService.toggleBan(report.reportedUser.id)
            }
        };

        const config = actionConfigs[action];
        if (!config) return;

        Swal.fire({
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
                        Swal.fire('Action Complete', 'The entity was managed and the report resolved.', 'success');
                    },
                    error: (err: any) => Swal.fire('Error', 'Failed to complete action: ' + (err.error?.message || 'Server error'), 'error')
                });
            }
        });
    }

    private performUpdate(id: number, status: string) {
        this.dataService.updateReportStatus(id, status).subscribe({
            next: () => {
                Swal.fire({
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
