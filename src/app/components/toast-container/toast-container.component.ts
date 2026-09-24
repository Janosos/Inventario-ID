import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-viewport" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item animate-toast-enter" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              }
              @case ('error') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              }
              @case ('warning') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              @default {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              }
            }
          </div>

          <div class="toast-content">
            <span class="toast-title">{{ toast.title }}</span>
            @if (toast.description) {
              <p class="toast-desc">{{ toast.description }}</p>
            }
          </div>

          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar notificación">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-viewport {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      z-index: 9999;
      max-width: 420px;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      background-color: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      color: var(--text-primary);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: transform var(--duration-fast) var(--ease-out), opacity var(--duration-fast) var(--ease-out);
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.1rem;
    }

    .toast-success .toast-icon { color: var(--accent-emerald); }
    .toast-error .toast-icon { color: var(--accent-rose); }
    .toast-warning .toast-icon { color: var(--accent-amber); }
    .toast-info .toast-icon { color: var(--brand-primary); }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .toast-title {
      font-size: 0.85rem;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text-primary);
    }

    .toast-desc {
      font-size: 0.775rem;
      color: var(--text-secondary);
      line-height: 1.4;
      margin: 0;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color var(--duration-fast) var(--ease-out);
    }

    .toast-close:hover {
      color: var(--text-primary);
      background-color: var(--bg-surface-hover);
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
