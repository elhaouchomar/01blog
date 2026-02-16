import { Component, OnInit, ChangeDetectorRef, effect, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';
import { SidebarComponent } from '../../components/left-sidebar/left-sidebar';
import { RightSidebarComponent } from '../../components/right-sidebar/right-sidebar';
import { PostCardComponent } from '../../components/post-card/post-card';
import { DataService } from '../../services/data.service';
import { Post, User } from '../../models/data.models';
import { ModalService } from '../../services/modal.service';
import { HostListener } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    NavbarComponent,
    SidebarComponent,
    RightSidebarComponent,
    PostCardComponent,
    CommonModule,
    RouterModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLoading = computed(() => this.dataService.posts().length === 0 && this.dataService.isLoggedIn());
  currentPage = 0;
  pageSize = 10;
  isMoreAvailable = signal(true);
  isFetchingMore = signal(false);
  private readonly scrollThreshold = 320;

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.dataService.posts().length === 0) {
      this.loadPosts();
    }
  }

  loadPosts() {
    this.dataService.fetchPosts(this.currentPage, this.pageSize).subscribe(posts => {
      this.isMoreAvailable.set(posts.length >= this.pageSize);
      this.ensureScrollableFeed();
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isFetchingMore() || !this.isMoreAvailable()) return;

    const viewportBottom = window.innerHeight + window.scrollY;
    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    // Load more when user is near the bottom.
    if (viewportBottom >= pageHeight - this.scrollThreshold) {
      this.loadMore();
    }
  }

  loadMore() {
    this.isFetchingMore.set(true);
    this.currentPage++;
    this.dataService.fetchPosts(this.currentPage, this.pageSize, true).subscribe({
      next: (posts) => {
        if (posts.length < this.pageSize) {
          this.isMoreAvailable.set(false);
        }
        this.isFetchingMore.set(false);
        this.ensureScrollableFeed();
      },
      error: () => this.isFetchingMore.set(false)
    });
  }

  private ensureScrollableFeed() {
    if (this.isFetchingMore() || !this.isMoreAvailable()) return;

    const pageHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const viewportHeight = window.innerHeight;

    // If page is still shorter than viewport after a fetch, prefetch next page.
    if (pageHeight <= viewportHeight + this.scrollThreshold) {
      this.loadMore();
    }
  }

  get posts() {
    return this.dataService.posts();
  }
}
