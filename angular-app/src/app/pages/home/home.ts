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
    this.dataService.loadPosts(this.currentPage, this.pageSize);
  }

  loadMore() {
    this.currentPage++;
    this.dataService.loadPosts(this.currentPage, this.pageSize, true);
  }

  get posts() {
    return this.dataService.posts();
  }
}
