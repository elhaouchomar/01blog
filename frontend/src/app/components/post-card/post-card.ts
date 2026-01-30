import { Component, Input, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Post } from '../../models/data.models';
import { ModalService } from '../../services/modal.service';
import { DataService } from '../../services/data.service';
import { ActionMenuComponent, ActionMenuItem } from '../action-menu/action-menu';
import { getInitials } from '../../utils/string.utils';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-post-card',
    standalone: true,
    imports: [CommonModule, RouterModule, ActionMenuComponent],
    templateUrl: './post-card.html',
    styleUrl: './post-card.css'
})
export class PostCardComponent {
    private _post!: Post;
    @Input() set post(value: Post) {
        this._post = value;
        this.computeMediaItems();
    }
    get post(): Post { return this._post; }

    currentUser: any = null;
    isExpanded: boolean = false;
    currentSlide = 0;
    cachedMediaItems: { url: SafeUrl, isVideo: boolean }[] = [];

    constructor(
        protected modalService: ModalService,
        public dataService: DataService,
        private cdr: ChangeDetectorRef,
        private sanitizer: DomSanitizer
    ) {
        effect(() => {
            this.currentUser = this.dataService.currentUser();
        });
    }

    private computeMediaItems() {
        if (!this._post) return;
        const items: { content: string, isVideo: boolean }[] = [];

        if (this._post.images && Array.isArray(this._post.images) && this._post.images.length > 0) {
            items.push(...this._post.images.map(img => ({ content: img, isVideo: this.checkIsVideo(img) })));
        }
        if (items.length === 0 && this._post.image) {
            items.push({ content: this._post.image, isVideo: this.checkIsVideo(this._post.image) });
        }
        if (this._post.video?.url) {
            items.push({ content: this._post.video.url, isVideo: true });
        }

        this.cachedMediaItems = items.map(item => ({
            url: this.sanitizer.bypassSecurityTrustUrl(item.content),
            isVideo: item.isVideo
        }));
    }

    get mediaItems() { return this.cachedMediaItems; }

    get hasMedia(): boolean {
        return this.cachedMediaItems.length > 0;
    }

    trackByMedia(index: number, item: any) {
        return item.url || index;
    }

    toggleExpand() {
        this.isExpanded = !this.isExpanded;
    }

    checkIsVideo(url: string): boolean {
        if (!url) return false;
        const u = url.toLowerCase();
        return u.startsWith('data:video') || u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov');
    }

    nextSlide(event: Event) {
        event.stopPropagation();
        if (this.currentSlide < this.mediaItems.length - 1) {
            this.currentSlide++;
            this.scrollToSlide();
        }
    }

    prevSlide(event: Event) {
        event.stopPropagation();
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.scrollToSlide();
        }
    }

    scrollToSlide() {
        const slider = document.querySelector(`#slider-${this.post.id}`);
        if (slider) {
            const slideWidth = slider.clientWidth;
            slider.scrollTo({ left: this.currentSlide * slideWidth, behavior: 'smooth' });
        }
    }

    onScroll(event: Event) {
        const target = event.target as HTMLElement;
        const slideWidth = target.clientWidth;
        if (slideWidth > 0) {
            this.currentSlide = Math.round(target.scrollLeft / slideWidth);
        }
    }

    // Use shared utility
    getInitials = getInitials;

    get canEdit(): boolean {
        if (!this.currentUser || !this.post.user) return false;
        return String(this.currentUser.id) === String(this.post.user.id);
    }

    get canDelete(): boolean {
        if (!this.currentUser || !this.post.user) return false;
        const isOwner = String(this.currentUser.id) === String(this.post.user.id);
        const isAdmin = this.currentUser.isAdmin || this.currentUser.role === 'ADMIN';
        return isOwner || isAdmin;
    }

    get canReport(): boolean {
        return this.currentUser && this.post.user && this.currentUser.id !== this.post.user.id;
    }

    get postActions(): ActionMenuItem[] {
        return [
            { id: 'edit', label: 'Edit Post', icon: 'edit', showIf: this.canEdit },
            { id: 'delete', label: 'Delete Post', icon: 'delete', class: 'delete', showIf: this.canDelete },
            { id: 'report', label: 'Report Post', icon: 'flag', class: 'warning', showIf: this.canReport }
        ];
    }

    handleDropdownAction(actionId: string) {
        if (actionId === 'edit') this.editPost();
        if (actionId === 'delete') this.deletePost();
        if (actionId === 'report') this.reportPost();
    }

    toggleLike() {
        if (!this.post || !this.post.id) return;
        this.dataService.toggleLike(this.post.id).subscribe({
            next: (updatedPost) => {
                this.post = updatedPost;
                this.cdr.detectChanges();
            },
            error: (err) => console.error('Error liking post:', err)
        });
    }

    editPost() {
        this.modalService.open('edit-post', this.post);
    }

    deletePost() {
        Swal.fire({
            title: 'Delete Post?',
            text: `Are you sure you want to permanently delete "${this.post.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.dataService.deletePost(this.post.id).subscribe({
                    next: () => {
                        this.dataService.loadPosts();
                        Swal.fire(
                            'Deleted!',
                            'Your post has been deleted.',
                            'success'
                        );
                    },
                    error: (err) => {
                        console.error('Error deleting post:', err);
                        Swal.fire('Error', 'Failed to delete post.', 'error');
                    }
                });
            }
        });
    }

    reportPost() {
        Swal.fire({
            title: 'Report Post?',
            text: 'Are you sure you want to flag this content? Our moderation team will review it.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Report',
            confirmButtonColor: '#d33',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.dataService.reportContent('General Report', undefined, this.post.id).subscribe({
                    next: () => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Report Received',
                            text: 'Thank you for your feedback.',
                            timer: 2000,
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false
                        });
                    },
                    error: () => Swal.fire('Error', 'Failed to submit report.', 'error')
                });
            }
        });
    }

    openMediaViewer(index: number) {
        this.modalService.open('media-viewer', {
            items: this.mediaItems,
            initialIndex: index
        });
    }

    openPostDetails(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.modalService.open('post-details', this.post);
    }
}
