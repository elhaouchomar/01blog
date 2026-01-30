import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { DataService } from '../../services/data.service';
import { ModalService } from '../../services/modal.service';

import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  isSidebarOpen = false;

  constructor(public modalService: ModalService, public dataService: DataService, private router: Router) { }

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/overview')) return 'Overview';
    if (url.includes('/users')) return 'User Management';
    if (url.includes('/posts')) return 'Content Moderator';
    if (url.includes('/reports')) return 'Safety & Reports';
    if (url.includes('/analytics')) return 'Platform Insights';
    return 'Dashboard';
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout() {
    this.dataService.logout();
  }
}
