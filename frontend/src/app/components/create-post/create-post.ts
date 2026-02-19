import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/services/modal.service';
import { DataService } from '../../core/services/data.service';
import { MaterialAlertService } from '../../core/services/material-alert.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css'
})
export class CreatePost implements OnInit, OnDestroy {
  readonly TITLE_MAX_LENGTH = 150;
  readonly CONTENT_MAX_LENGTH = 10000;
  title = '';
  content = '';
  imageUrls: string[] = []; // For preview
  selectedFileNames: string[] = [];
  selectedFiles: File[] = [];
  isLoading = false;

  constructor(
    protected modalService: ModalService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private alert: MaterialAlertService
  ) { }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          this.alert.fire('Error', `File ${file.name} is too large (max 10MB)`, 'error');
          return;
        }

        this.selectedFileNames.push(file.name);
        this.selectedFiles.push(file);

        // Convert file to Base64 only for preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.ngZone.run(() => {
            this.imageUrls.push(e.target.result);
            this.cdr.detectChanges();
          });
        };
        reader.readAsDataURL(file);
      });
      input.value = '';
    }
  }

  createPost() {
    if (this.isLoading) return;

    this.title = this.sanitizeInput(this.title);
    this.content = this.sanitizeInput(this.content);

    if (!this.title.trim() || !this.content.trim()) {
      this.alert.fire('Validation Error', 'Title and content are required.', 'warning');
      return;
    }

    if (this.title.length < 3 || this.title.length > this.TITLE_MAX_LENGTH) {
      this.alert.fire('Validation Error', `Title must be between 3 and ${this.TITLE_MAX_LENGTH} characters.`, 'warning');
      return;
    }

    if (this.content.length < 3 || this.content.length > this.CONTENT_MAX_LENGTH) {
      this.alert.fire('Validation Error', `Content must be between 3 and ${this.CONTENT_MAX_LENGTH} characters.`, 'warning');
      return;
    }

    this.isLoading = true;

    if (this.selectedFiles.length > 0) {
      // First upload files
      this.dataService.uploadFiles(this.selectedFiles).subscribe({
        next: (fileNames) => {
          const remoteUrls = fileNames.map(name => `${this.dataService.getBaseUrl()}/uploads/${name}`);
          this.submitPost(remoteUrls);
        },
        error: (err) => {
          this.alert.fire('Error', 'Failed to upload media. Please try again.', 'error');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.submitPost([]);
    }
  }

  onTitleInput(value: string) {
    this.title = this.limitText(value, this.TITLE_MAX_LENGTH);
  }

  onContentInput(value: string) {
    this.content = this.limitText(value, this.CONTENT_MAX_LENGTH);
  }

  private submitPost(mediaUrls: string[]) {
    this.dataService.addPost({
      title: this.title,
      content: this.content,
      images: mediaUrls.length > 0 ? mediaUrls : undefined
    }).subscribe({
      next: (newPost) => {
        this.title = '';
        this.content = '';
        this.imageUrls = [];
        this.selectedFileNames = [];
        this.selectedFiles = [];
        this.isLoading = false;
        this.cdr.detectChanges();
        this.modalService.close();
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
        if (err.status === 403 || err.status === 401) {
          this.alert.fire('Session Expired', 'Please log in again.', 'warning');
          this.modalService.close();
          this.dataService.logout();
        } else {
          const details = err?.error?.data;
          const firstDetail = details && typeof details === 'object'
            ? Object.values(details)[0] as string
            : '';
          const message = firstDetail || err?.error?.message || err?.message || 'Failed to create post. Please try again.';
          this.alert.fire('Error', message, 'error');
        }
      }
    });
  }

  removeMedia(index: number) {
    this.imageUrls.splice(index, 1);
    this.selectedFileNames.splice(index, 1);
  }

  isVideo(url: string): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    // Start with data URI check for videos
    if (u.startsWith('data:video')) return true;
    return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov') || u.includes('youtube.com') || u.includes('vimeo.com');
  }

  ngOnInit() {
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modalService.close();
  }

  // Close modal on Escape key
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    event.preventDefault();
    this.close();
  }

  ngOnDestroy() {
    // Restore scrolling when modal is destroyed
    document.body.style.overflow = '';
  }

  private sanitizeInput(value: string): string {
    if (typeof document === 'undefined') {
      return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }

  private limitText(value: string, maxLength: number): string {
    return (value || '').slice(0, maxLength);
  }
}
