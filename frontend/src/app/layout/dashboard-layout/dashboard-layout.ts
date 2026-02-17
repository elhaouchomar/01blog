import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

import { DataService } from '../../core/services/data.service';
import { ModalService } from '../../core/services/modal.service';

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

  constructor(public modalService: ModalService, public dataService: DataService, private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isSidebarOpen = false;
      });
  }

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
    if (this.isSidebarOpen) {
      setTimeout(() => {
        const nav = document.querySelector('.dashboard-sidebar .sidebar-nav') as HTMLElement | null;
        if (nav) nav.scrollTop = 0;
      }, 0);
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (window.innerWidth > 1024 && this.isSidebarOpen) {
      this.isSidebarOpen = false;
    }
  }

  logout() {
    this.dataService.logout();
  }
}
