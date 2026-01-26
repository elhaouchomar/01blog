import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Post, Comment } from '../../models/data.models';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './post-details.html',
  styleUrl: './post-details.css'
})
export class PostDetails implements OnInit {
  @Input() post: Post | undefined;
  comments: any[] = [];
  newComment = '';

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private router: Router,
    protected modalService: ModalService
  ) { }

  ngOnInit() {
    // If opened via routing (legacy)
    this.route.params.subscribe(params => {
      if (params['id']) {
        const id = Number(params['id']);
        this.dataService.getPost(id).subscribe({
          next: (post) => {
            this.post = post;
            this.comments = post.replies || [];
          },
          error: (err) => console.error('Error loading post:', err)
        });
      }
    });

    // If opened via modal service
    if (!this.post && this.modalService.modalData()) {
      const data = this.modalService.modalData();
      if (data.id) {
        this.dataService.getPost(data.id).subscribe({
          next: (post) => {
            this.post = post;
            this.comments = post.replies || [];
          },
          error: (err) => console.error('Error loading post:', err)
        });
      } else {
        this.post = data;
        this.comments = data.replies || [];
      }
    }
  }

  addComment() {
    if (!this.newComment.trim() || !this.post) return;

    this.dataService.addComment(this.post.id, this.newComment.trim()).subscribe({
      next: (comment) => {
        this.comments.push(comment);
        this.newComment = '';
        if (this.post) this.post.comments++;
      },
      error: (err) => console.error('Error adding comment:', err)
    });
  }

  toggleLike() {
    if (!this.post) return;

    this.dataService.toggleLike(this.post.id).subscribe({
      next: (updatedPost) => {
        if (this.post) {
          this.post.likes = updatedPost.likes;
          this.post.isLiked = updatedPost.isLiked;
        }
      },
      error: (err) => console.error('Error toggling like:', err)
    });
  }

  isVideo(url: string | undefined): boolean {
    if (!url) return false;
    const u = url.toLowerCase();
    return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov');
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
          this.dataService.loadPosts(); // Refresh dashboard list
        },
        error: (err) => console.error('Error deleting post:', err)
      });
    }
  }

  close() {
    this.modalService.close();
  }
}
