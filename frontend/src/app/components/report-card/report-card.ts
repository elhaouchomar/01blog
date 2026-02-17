import { Component, Input, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service'; // Import DataService

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './report-card.component.html',
  styleUrl: './report-card.component.css'
})
export class ReportCardComponent {
  @Input() report: any;
  @Output() onAction = new EventEmitter<{ report: any, action: string }>();
  @Output() onViewTarget = new EventEmitter<any>();

  currentUser: any = null; // Add currentUser property

  constructor(private dataService: DataService) { // Inject DataService
    effect(() => {
      this.currentUser = this.dataService.currentUser();
    });
  }
}
