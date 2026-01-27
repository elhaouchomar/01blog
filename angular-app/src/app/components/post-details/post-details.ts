import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Post, Comment } from '../../models/data.models';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';
import { ActionMenuComponent, ActionMenuItem } from '../action-menu/action-menu';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ActionMenuComponent],
  templateUrl: './post-details.html',
  styleUrl: './post-details.css'
})
export class PostDetails implements OnInit {
  private _post: Post | undefined;
  @Input() set post(value: Post | undefined) {
    this._post = value;
    this.computeMediaItems();
  }
  get post(): Post | undefined { return this._post; }

  comments: any[] = [];
  newComment = '';
  currentSlide = 0;
  isSubmitting = false;
  cachedMediaItems: { url: string, isVideo: boolean }[] = [];

  constructor(
    private route: ActivatedRoute,
    public dataService: DataService,
    private router: Router,
    protected modalService: ModalService
  ) { }

  ngOnInit() {
    this.currentSlide = 0;

    // If opened via modal service
    const modalData = this.modalService.modalData();
    if (modalData) {
      if (modalData.id) {
        this.dataService.getPost(modalData.id).subscribe({
          next: (post) => {
            this.post = post;
            this.comments = post.replies || [];
          },
          error: (err) => console.error('Error loading post:', err)
        });
      } else {
        this.post = modalData;
        this.comments = modalData.replies || [];
      }
    }
  }

  private computeMediaItems() {
    if (!this._post) {
      this.cachedMediaItems = [];
      return;
    }
    const items: { url: string, isVideo: boolean }[] = [];

    if (this._post.video?.url) {
      items.push({ url: this._post.video.url, isVideo: true });
    }

    if (this._post.images && this._post.images.length > 0) {
      this._post.images.forEach(img => items.push({ url: img, isVideo: this.isVideo(img) }));
    } else if (this._post.image) {
      items.push({ url: this._post.image, isVideo: this.isVideo(this._post.image) });
    }

    this.cachedMediaItems = items;
  }

  get mediaItems() { return this.cachedMediaItems; }

  trackByMedia(index: number, item: any) {
    return item.url || index;
  }

  trackByComment(index: number, comment: any) {
    return comment.id || index;
  }

  addComment() {
    if (!this.newComment.trim() || !this.post || this.isSubmitting) return;

    this.isSubmitting = true;
    this.dataService.addComment(this.post.id, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.comments = [...this.comments, comment];
        this.newComment = '';
        if (this.post) this.post.comments++;
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        this.isSubmitting = false;
      }
    });
  }

  nextSlide() {
    if (this.currentSlide < this.mediaItems.length - 1) {
      this.currentSlide++;
    }
  }

  prevSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
    }
  }

  toggleLike() {
    if (!this.post) return;

    // Optimistic UI update
    const prevLikes = this.post.likes;
    const prevIsLiked = this.post.isLiked;

    this.post.isLiked = !this.post.isLiked;
    this.post.likes += this.post.isLiked ? 1 : -1;

    this.dataService.toggleLike(this.post.id).subscribe({
      next: (updatedPost) => {
        if (this.post) {
          this.post.likes = updatedPost.likes;
          this.post.isLiked = updatedPost.isLiked;
        }
      },
      error: (err) => {
        console.error('Error toggling like:', err);
        if (this.post) {
          this.post.likes = prevLikes;
          this.post.isLiked = prevIsLiked;
        }
      }
    });
  }

  toggleCommentLike(comment: any) {
    if (!comment || !comment.id) return;

    // Optimistic UI update
    const prevLikes = comment.likes;
    const prevIsLiked = comment.isLiked;

    comment.isLiked = !comment.isLiked;
    comment.likes += comment.isLiked ? 1 : -1;

    this.dataService.toggleCommentLike(comment.id).subscribe({
      next: (updatedComment) => {
        const index = this.comments.findIndex(c => c.id === updatedComment.id);
        if (index !== -1) {
          this.comments[index] = { ...this.comments[index], ...updatedComment };
          this.comments = [...this.comments];
        }
      },
      error: (err) => {
        console.error('Error toggling comment like:', err);
        comment.isLiked = prevIsLiked;
        comment.likes = prevLikes;
      }
    });
  }

  toggleSubscribe() {
    if (!this.post || !this.post.user) return;

    // The subscribe is currently on current user me in data service.
    // Wait, let's check DataService toggleSubscribe. (Line 308 in 1549). 
    // It's toggleSubscribe(): Observable<User> AND it uses /users/me/subscribe.
    // That means it toggle subscription for the current user (maybe to a plan?).
    // Usually "subscribe" to a user is "follow". 
    // DataService has followUser(userId: number). (Line 317 in 1549).
    // User model has isSubscribed and isFollowing. (Line 25-27 in 1552).
    // I'll assume "subscribe" to author means follow/subscribe logic.
    // I'll use the followUser method for now but name the UI "Subscribe".

    this.dataService.followUser(this.post.user.id).subscribe({
      next: () => {
        // Refresh post to get new following state if any, or just local update
        if (this.post && this.post.user) {
          // Note: Post.user is UserSummaryDTO which doesn't have isFollowing.
          // This is a model limitation. I'll just show success toast if I had one.
        }
      },
      error: (err) => console.error('Error subscribing:', err)
    });
  }

  isVideo(url: string | undefined): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.startsWith('data:video') || u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov');
  }

  get canEdit(): boolean {
    const cu = this.dataService.currentUser();
    return !!(cu && this.post && cu.id === this.post.user.id);
  }

  get canDelete(): boolean {
    const cu = this.dataService.currentUser();
    if (!cu || !this.post) return false;
    return cu.id === this.post.user.id || this.dataService.isAdmin();
  }

  get canReport(): boolean {
    const cu = this.dataService.currentUser();
    return !!(cu && this.post && cu.id !== this.post.user.id);
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

  editPost() {
    if (!this.post) return;
    this.modalService.open('edit-post', this.post);
  }

  deletePost() {
    if (!this.post) return;
    if (confirm(`Are you sure you want to permanently delete "${this.post.title}"?`)) {
      this.dataService.deletePost(this.post.id).subscribe({
        next: () => {
          this.close();
          this.dataService.loadPosts();
        },
        error: (err) => console.error('Error deleting post:', err)
      });
    }
  }

  reportPost() {
    if (!this.post) return;
    const reportData = { ...this.post, reportType: 'post' };
    this.modalService.open('report-post', reportData);
  }

  goToProfile(userId: number) {
    if (!userId) return;
    this.close();
    this.router.navigate(['/profile', userId]);
  }

  close() {
    this.modalService.close();
  }
}
