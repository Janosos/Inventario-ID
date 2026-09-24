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
          <a class="nav-item" (click)="selectTab('general')" [class.active]="activeTab === 'general'">
            <span class="material-symbols-outlined">dashboard</span>
            <span>Vista General</span>
          </a>

          <a class="nav-item" (click)="selectTab('inventario')" [class.active]="activeTab === 'inventario'">
            <span class="material-symbols-outlined">devices</span>
            <span>Inventario de Equipos</span>
          </a>

          <a class="nav-item" (click)="selectTab('asignaciones')" [class.active]="activeTab === 'asignaciones'">
            <span class="material-symbols-outlined">assignment_ind</span>
            <span>Asignaciones & Custodia</span>
          </a>

          <a class="nav-item" (click)="selectTab('mantenimiento')" [class.active]="activeTab === 'mantenimiento'">
            <span class="material-symbols-outlined">build_circle</span>
            <span>Mantenimiento & Bajas</span>
          </a>

          <a class="nav-item" (click)="selectTab('auditorias')" [class.active]="activeTab === 'auditorias'">
            <span class="material-symbols-outlined">analytics</span>
            <span>Auditorías & Reportes</span>
          </a>
        </nav>
      </div>

      <!-- Sync Status Widget -->
      <div class="sync-telemetry-box">
        <div class="sync-telemetry-header">
          <span class="sync-label">CAPACIDAD SYNC</span>
          <span class="sync-percent">99.2%</span>
        </div>
        <div class="sync-progress-track">
          <div class="sync-progress-fill" style="width: 99.2%"></div>
        </div>
        <div class="sync-node-row">
          <span class="sync-node-label">Nodo Central</span>
          <span class="sync-node-val">Supabase Cloud</span>
        </div>
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

    .dark .nav-item.active {
      background-color: var(--primary-container);
      color: #00263d;
      font-weight: 700;
    }

    .nav-item .material-symbols-outlined {
      font-size: 20px;
    }

    /* Telemetry Box */
    .sync-telemetry-box {
      background-color: var(--surface-low);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .sync-telemetry-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .sync-label {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .sync-percent {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--secondary);
    }

    .sync-progress-track {
      width: 100%;
      height: 5px;
      background-color: var(--surface-high);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .sync-progress-fill {
      height: 100%;
      background-color: var(--secondary);
      border-radius: var(--radius-full);
    }

    .sync-node-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.7rem;
      padding-top: 0.2rem;
    }

    .sync-node-label {
      color: var(--text-outline);
    }

    .sync-node-val {
      font-family: var(--font-mono);
      color: var(--primary);
      font-weight: 600;
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

  activeTab = 'inventario';

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.tabSelected.emit(tab);
    this.closeSidebar.emit();
  }
}
