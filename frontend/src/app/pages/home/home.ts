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

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.dataService.posts().length === 0 && this.dataService.isLoggedIn()) {
      this.loadPosts();
    }
  }

  loadPosts() {
    this.dataService.fetchPosts(this.currentPage, this.pageSize).subscribe(posts => {
      this.isMoreAvailable.set(posts.length >= this.pageSize);
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.isFetchingMore() || !this.isMoreAvailable()) return;

    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
    const max = document.documentElement.scrollHeight;

    // Load more when 200px from bottom
    if (pos >= max - 200) {
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
      },
      error: () => this.isFetchingMore.set(false)
    });
  }

  get posts() {
    return this.dataService.posts();
  }
}

