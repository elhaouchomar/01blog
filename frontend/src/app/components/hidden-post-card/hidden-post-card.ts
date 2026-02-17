import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Post } from '../../shared/models/data.models';

@Component({
  selector: 'app-hidden-post-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './hidden-post-card.html',
  styleUrl: './hidden-post-card.css'
})
export class HiddenPostCardComponent {
  @Input() post!: Post;
  @Output() unhide = new EventEmitter<Post>();
  @Output() delete = new EventEmitter<Post>();
}
