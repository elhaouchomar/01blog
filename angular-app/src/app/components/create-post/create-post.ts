import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-post.html',
  styleUrl: './create-post.css'
})
export class CreatePost implements OnInit, OnDestroy {
  title = '';
  content = '';
  imageUrls: string[] = []; // For preview
  selectedFileNames: string[] = [];
  selectedFiles: File[] = [];
  isLoading = false;

  constructor(protected modalService: ModalService, private dataService: DataService) {
    console.log('CreatePost Component Constructor - Modal Service:', modalService);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          alert(`File ${file.name} is too large (max 10MB)`);
          return;
        }

        this.selectedFileNames.push(file.name);
        this.selectedFiles.push(file);

        // Convert file to Base64 only for preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imageUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
      input.value = '';
    }
  }

  createPost() {
    if (!this.title.trim() || !this.content.trim()) {
      alert('Title and content are required.');
      return;
    }

    if (this.title.length < 3 || this.title.length > 150) {
      alert('Title must be between 3 and 150 characters.');
      return;
    }

    if (this.content.length < 3) {
      alert('Content must be at least 3 characters.');
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
          console.error('Error uploading files:', err);
          alert('Failed to upload media. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      this.submitPost([]);
    }
  }

  private submitPost(mediaUrls: string[]) {
    this.dataService.addPost({
      title: this.title,
      content: this.content,
      images: mediaUrls.length > 0 ? mediaUrls : undefined
    }).subscribe({
      next: (newPost) => {
        console.log('Post created successfully:', newPost);
        this.title = '';
        this.content = '';
        this.imageUrls = [];
        this.selectedFileNames = [];
        this.selectedFiles = [];
        this.isLoading = false;
        this.modalService.close();
      },
      error: (err) => {
        console.error('Error creating post:', err);
        this.isLoading = false;
        if (err.status === 403 || err.status === 401) {
          alert('Session expired. Please log in again.');
          this.modalService.close();
          this.dataService.logout();
        } else {
          alert('Failed to create post. Please try again.');
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
    console.log('CreatePost Component Initialized');
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    console.log('Body overflow hidden set');
  }

  close() {
    console.log('Closing modal from component');
    this.modalService.close();
  }

  // Close modal on Escape key
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: Event) {
    console.log('Escape key pressed');
    event.preventDefault();
    this.close();
  }

  ngOnDestroy() {
    console.log('CreatePost Component Destroyed');
    // Restore scrolling when modal is destroyed
    document.body.style.overflow = '';
  }
}