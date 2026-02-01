import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-db-feedback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Empty State -->
    <div *ngIf="type === 'empty'" 
         class="text-center py-5 bg-white border rounded-4 shadow-sm my-4 transition-all hover-shadow"
         style="backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.05) !important; background-color: #ffffff !important;">
      <div class="mx-auto mb-4 rounded-circle d-flex align-items-center justify-content-center pulse-animation" 
           [style.background-color]="iconColor + '15'" [style.color]="iconColor" style="width: 100px; height: 100px;">
        <span class="material-symbols-outlined display-4">{{ icon }}</span>
      </div>
      <h3 class="h4 fw-bold mb-2">{{ title }}</h3>
      <p class="text-secondary mx-auto" style="max-width: 350px; font-size: 0.95rem;">{{ message }}</p>
    </div>

    <!-- Loading State -->
    <div *ngIf="type === 'loading'" class="text-center py-5 my-5">
      <div class="loading-wrapper mx-auto mb-4">
          <div class="loader-circle"></div>
          <div class="loader-circle delay-1"></div>
          <div class="loader-circle delay-2"></div>
          <span class="material-symbols-outlined loader-icon">refresh</span>
      </div>
      <p class="text-muted fw-bold text-uppercase small" style="letter-spacing: 0.1em; color: #6c757d;">Synchronizing Platform...</p>
    </div>

    <style>
      .pulse-animation {
        animation: pulse 2s infinite ease-in-out;
      }
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        50% { transform: scale(1.05); box-shadow: 0 0 20px 5px rgba(0,0,0,0.02); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
      }
      
      .loading-wrapper {
        position: relative;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .loader-circle {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid transparent;
        border-top-color: #0d6efd;
        border-radius: 50%;
        animation: spin 1.5s linear infinite;
      }
      .loader-circle.delay-1 { animation-duration: 2s; border-top-color: #6610f2; opacity: 0.6; }
      .loader-circle.delay-2 { animation-duration: 2.5s; border-top-color: #6f42c1; opacity: 0.3; }
      
      .loader-icon {
        color: #0d6efd;
        font-size: 24px;
        animation: counter-spin 2s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes counter-spin {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }
    </style>
  `
})
export class DbFeedbackComponent {
  @Input() type: 'empty' | 'loading' = 'empty';
  @Input() icon: string = 'inbox';
  @Input() iconColor: string = '#6c757d';
  @Input() title: string = 'No results found';
  @Input() message: string = 'Try adjusting your filters or search terms.';
}
