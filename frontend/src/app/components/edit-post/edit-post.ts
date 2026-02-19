import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../core/services/modal.service';
import { DataService } from '../../core/services/data.service';
import { Post } from '../../shared/models/data.models';
import { MaterialAlertService } from '../../core/services/material-alert.service';

@Component({
    selector: 'app-edit-post',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './edit-post.html',
    styleUrl: './edit-post.css'
})
export class EditPost implements OnInit, OnDestroy {
    readonly TITLE_MAX_LENGTH = 150;
    readonly CONTENT_MAX_LENGTH = 10000;
    title = '';
    content = '';
    imageUrls: string[] = []; // For preview/existing
    selectedFileNames: string[] = [];
    selectedFiles: File[] = []; // Added for newly selected files
    post: Post | null = null;
    isLoading = false;

    constructor(
        protected modalService: ModalService,
        private dataService: DataService,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone,
        private alert: MaterialAlertService
    ) {
        // Get the post data from modal service
        const data = this.modalService.modalData();
        if (data && data.id) {
            this.post = data as Post;
            this.title = this.post.title || '';
            this.content = this.post.content || '';

            // Handle both legacy single image and new images array
            if (this.post.images && this.post.images.length > 0) {
                this.imageUrls = [...this.post.images];
            } else if (this.post.image) {
                this.imageUrls = [this.post.image];
            }
        }
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            // Process all selected files
            Array.from(input.files).forEach(file => {
                // Validate file size (max 10MB)
                const maxSize = 10 * 1024 * 1024; // 10MB
                if (file.size > maxSize) {
                    alert(`File ${file.name} is too large (max 10MB)`);
                    return;
                }

                this.selectedFileNames.push(file.name);
                this.selectedFiles.push(file);

                // Convert file to Base64
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.ngZone.run(() => {
                        this.imageUrls.push(e.target.result);
                        this.cdr.detectChanges();
                    });
                };
                reader.readAsDataURL(file);
            });

            // Reset input value
            input.value = '';
        }
    }

    updatePost() {
        this.title = this.sanitizeInput(this.title);
        this.content = this.sanitizeInput(this.content);

        if (!this.title || !this.content || !this.post) return;
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
            this.dataService.uploadFiles(this.selectedFiles).subscribe({
                next: (fileNames) => {
                    const newRemoteUrls = fileNames.map(name => `${this.dataService.getBaseUrl()}/uploads/${name}`);
                    const remainingExistingUrls = this.imageUrls.filter(url => url.startsWith('http'));
                    this.submitUpdate([...remainingExistingUrls, ...newRemoteUrls]);
                },
                error: (err) => {
                    alert('Failed to upload media.');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.submitUpdate(this.imageUrls);
        }
    }

    onTitleInput(value: string) {
        this.title = this.limitText(value, this.TITLE_MAX_LENGTH);
    }

    onContentInput(value: string) {
        this.content = this.limitText(value, this.CONTENT_MAX_LENGTH);
    }

    private submitUpdate(finalUrls: string[]) {
        if (!this.post) return;
        this.dataService.updatePost(this.post.id, {
            title: this.title,
            content: this.content,
            images: finalUrls.length > 0 ? finalUrls : undefined
        }).subscribe({
            next: (updatedPost) => {
                this.isLoading = false;
                this.cdr.detectChanges();
                this.modalService.close();
            },
            error: (err) => {
                const details = err?.error?.data;
                const firstDetail = details && typeof details === 'object'
                    ? Object.values(details)[0] as string
                    : '';
                const message = firstDetail || err?.error?.message || 'Failed to update post.';
                this.alert.fire('Error', message, 'error');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    removeMedia(index: number) {
        this.imageUrls.splice(index, 1);
        // Only remove from selectedFileNames if we have any (won't be sync'd with pre-existing images but length check protects array access)
        if (index < this.selectedFileNames.length) {
            this.selectedFileNames.splice(index, 1);
        }
    }

    isVideo(url: string): boolean {
        if (!url) return false;
        const u = url.toLowerCase();
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
