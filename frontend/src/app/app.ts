import { Component, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { filter } from 'rxjs';
import { ModalService } from './services/modal.service';
import { CreatePost } from './components/create-post/create-post';
import { EditPost } from './components/edit-post/edit-post';
import { PostDetails } from './components/post-details/post-details';
import { CreateUser } from './components/create-user/create-user';
import { EditProfileModal } from './components/edit-profile/edit-profile';
import { ToastContainer } from './components/toast-container/toast-container';
import { AdminEditUser } from './components/admin-edit-user/admin-edit-user';

import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    CreatePost,
    EditPost,
    PostDetails,
    CreateUser,
    EditProfileModal,
    ToastContainer,
    AdminEditUser
  ],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('angular-app');
  constructor(protected modalService: ModalService, private dataService: DataService, private router: Router) {
    if (localStorage.getItem('auth_token')) {
      this.dataService.getProfile().subscribe({
        error: () => localStorage.removeItem('auth_token') // Clear invalid tokens
      });
    }

    // Handle deep links for posts (unify modal experience)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      const match = url.match(/\/post\/(\d+)/);
      if (match) {
        const postId = match[1];
        this.modalService.open('post-details', { id: +postId });
        this.router.navigate(['/home'], { replaceUrl: true }); // Clean up URL
      }
    });
  }
}
