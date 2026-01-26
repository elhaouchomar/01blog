import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { ModalService } from './services/modal.service';
import { CreatePost } from './components/create-post/create-post';
import { EditPost } from './components/edit-post/edit-post';
import { PostDetails } from './components/post-details/post-details';
import { ReportModal } from './components/report-modal/report-modal';
import { SuccessPosted } from './components/success-posted/success-posted';
import { ConfirmDeletePost } from './components/confirm-delete-post/confirm-delete-post';
import { MediaViewer } from './components/media-viewer/media-viewer';
import { CreateUser } from './components/create-user/create-user';
import { EditProfileModal } from './components/edit-profile/edit-profile';
import { ConfirmBanUser } from './components/confirm-ban-user/confirm-ban-user';
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
    ReportModal,
    SuccessPosted,
    SuccessPosted,
    ConfirmDeletePost,
    MediaViewer,
    CreateUser,
    EditProfileModal,
    ConfirmBanUser,
    ToastContainer,
    AdminEditUser
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-app');
  constructor(protected modalService: ModalService, private dataService: DataService) {
    if (localStorage.getItem('auth_token')) {
      this.dataService.getProfile().subscribe({
        error: () => localStorage.removeItem('auth_token') // Clear invalid tokens
      });
    }
  }
}
