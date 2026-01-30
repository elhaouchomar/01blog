import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../services/data.service';
import { RouterLink } from '@angular/router';
import { DbPageHeaderComponent } from '../../../components/dashboard/db-page-header';
import { DbFeedbackComponent } from '../../../components/dashboard/db-feedback';

@Component({
    selector: 'app-dashboard-overview',
    standalone: true,
    imports: [CommonModule, RouterLink, DbPageHeaderComponent, DbFeedbackComponent],
    templateUrl: './overview.html',
    styleUrl: './overview.css',
})
export class DashboardOverview implements OnInit {
    isLoading = computed(() => this.dataService.dashboardStats() === null);

    constructor(public dataService: DataService) { }

    ngOnInit() {
        // Initial load handled by DataService if not already loaded
        if (!this.dataService.dashboardStats()) {
            this.dataService.loadDashboardStats();
        }
    }

    get stats() {
        return this.dataService.dashboardStats() || {
            totalUsers: 0,
            totalPosts: 0,
            totalReports: 0,
            bannedUsers: 0,
            pendingReports: 0,
            activity: [],
            mostReportedUsers: []
        };
    }

    getActivityPercentage(count: number): number {
        const activity = this.stats.activity;
        if (!activity || activity.length === 0) return 0;
        const max = Math.max(...activity.map((a: any) => a.count));
        return max > 0 ? (count / max) * 100 : 0;
    }
}
