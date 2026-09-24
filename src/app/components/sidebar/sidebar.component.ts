import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar-wrapper" [class.sidebar-open]="isOpen">
      <div class="sidebar-top">
        <div class="sidebar-section-label">
          <span>OPERACIONES TI</span>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item active" (click)="selectTab('inventario')">
            <span class="material-symbols-outlined">devices</span>
            <span>Inventario de Equipos</span>
          </a>
        </nav>
      </div>
    </aside>

    <!-- Mobile Backdrop -->
    @if (isOpen) {
      <div class="sidebar-backdrop" (click)="closeSidebar.emit()"></div>
    }
  `,
  styles: [`
    .sidebar-wrapper {
      position: fixed;
      left: 0;
      top: 4rem;
      bottom: 0;
      width: 16rem;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      z-index: 40;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem 0.85rem;
      transition: transform var(--duration-normal) var(--ease-out);
    }

    .sidebar-section-label {
      padding: 0 0.75rem 0.75rem;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--text-outline);
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      user-select: none;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .nav-item:hover {
      background-color: var(--surface-high);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: var(--primary-container);
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(14, 165, 233, 0.3);
    }

    html.dark .nav-item.active {
      background-color: var(--primary-container);
      color: #00263d;
      font-weight: 700;
    }

    .nav-item .material-symbols-outlined {
      font-size: 20px;
    }

    .sidebar-backdrop {
      display: none;
    }

    @media (max-width: 1024px) {
      .sidebar-wrapper {
        transform: translateX(-100%);
      }
      .sidebar-wrapper.sidebar-open {
        transform: translateX(0);
      }
      .sidebar-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 35;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() tabSelected = new EventEmitter<string>();

  selectTab(tab: string): void {
    this.tabSelected.emit(tab);
    this.closeSidebar.emit();
  }
}
