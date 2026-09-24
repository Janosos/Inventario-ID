import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar-root">
      <div class="navbar-inner">
        <!-- Left: Mobile Toggle & Brand Logo -->
        <div class="brand-cluster">
          <button class="mobile-menu-btn lg-hidden" (click)="toggleSidebar.emit()" aria-label="Menú lateral">
            <span class="material-symbols-outlined">menu</span>
          </button>

          <div class="brand-box">
            <div class="brand-chip-icon">
              <span class="material-symbols-outlined text-primary">memory</span>
            </div>
            <div class="brand-texts">
              <div class="brand-title-row">
                <span class="brand-title">Inventario-ID</span>
                <span class="version-tag">v2.4</span>
              </div>
              <span class="brand-subtitle">Control & Gestión IT Empresarial</span>
            </div>
          </div>
        </div>

        <!-- Center: Role Indicator -->
        <div class="role-center-cluster">
          @if (supabase.isAdmin()) {
            <div class="role-tag-box role-admin-box">
              <span class="material-symbols-outlined text-tertiary">verified_user</span>
              <span class="role-name-text text-tertiary">ADMINISTRADOR</span>
            </div>
          } @else {
            <div class="role-tag-box role-normal-box">
              <span class="material-symbols-outlined text-secondary">person</span>
              <span class="role-name-text text-secondary">USUARIO NORMAL</span>
            </div>
          }
        </div>

        <!-- Right: Status, Actions, Profile -->
        <div class="actions-cluster">
          <!-- Connection Status Telemetry -->
          <div class="telemetry-badge">
            <div class="beacon-wrap">
              <span class="beacon-ping"></span>
              <span class="beacon-dot"></span>
            </div>
            <div class="telemetry-text">
              <span class="telemetry-status">Supabase Conectado</span>
              <span class="telemetry-sub">Sync: En vivo</span>
            </div>
          </div>

          <!-- Admin User Management Action -->
          @if (supabase.isAdmin()) {
            <button class="btn btn-secondary btn-sm admin-btn" (click)="openUsers.emit()" title="Gestionar Usuarios y Roles">
              <span class="material-symbols-outlined">group</span>
              <span class="btn-text-desktop">Usuarios</span>
            </button>
          }

          <!-- Theme Toggle -->
          <button 
            class="btn btn-ghost btn-icon-sm" 
            (click)="theme.toggleTheme()" 
            [title]="theme.currentTheme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
            @if (theme.currentTheme() === 'dark') {
              <span class="material-symbols-outlined text-primary">light_mode</span>
            } @else {
              <span class="material-symbols-outlined">dark_mode</span>
            }
          </button>

          <!-- User Menu / Auth Button -->
          @if (supabase.currentUser()) {
            <div class="user-profile-cluster">
              <div class="user-avatar-circle">
                <span class="material-symbols-outlined">person</span>
              </div>
              <div class="user-text-meta">
                <span class="user-email-header">{{ supabase.currentUser()?.email }}</span>
                <span class="user-role-sub">{{ supabase.isAdmin() ? 'SYSADMIN_L3' : 'OPERADOR_L1' }}</span>
              </div>
              <button class="btn-logout" (click)="supabase.signOut()" title="Cerrar Sesión">
                <span class="material-symbols-outlined">logout</span>
              </button>
            </div>
          } @else {
            <button class="btn btn-primary btn-sm" (click)="openAuth.emit()">
              <span class="material-symbols-outlined">login</span>
              <span>Acceder</span>
            </button>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-root {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4rem;
      z-index: 50;
      background-color: rgba(15, 19, 28, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      box-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
    }

    .dark .navbar-root {
      background-color: rgba(15, 19, 28, 0.92);
    }

    :host-context(.light) .navbar-root {
      background-color: rgba(255, 255, 255, 0.94);
    }

    .navbar-inner {
      height: 100%;
      width: 100%;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .brand-cluster {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .mobile-menu-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
    }

    @media (min-width: 1025px) {
      .lg-hidden {
        display: none !important;
      }
    }

    .brand-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-chip-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      background-color: var(--surface-container);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-glow-blue);
      border: 1px solid var(--border-subtle);
    }

    .brand-chip-icon .material-symbols-outlined {
      font-size: 22px;
      color: var(--primary);
    }

    .brand-texts {
      display: flex;
      flex-direction: column;
    }

    .brand-title-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .brand-title {
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .version-tag {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 600;
      background: rgba(137, 206, 255, 0.12);
      color: var(--primary);
      padding: 0.1rem 0.35rem;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
    }

    .brand-subtitle {
      font-size: 0.725rem;
      color: var(--text-muted);
      line-height: 1.2;
    }

    .role-center-cluster {
      display: flex;
      align-items: center;
    }

    .role-tag-box {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-md);
      font-family: var(--font-mono);
      font-size: 0.725rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .role-admin-box {
      background: var(--surface-high);
      border: 1px solid rgba(255, 185, 95, 0.25);
    }

    .role-admin-box .text-tertiary {
      color: var(--tertiary);
    }

    .role-normal-box {
      background: var(--surface-container);
      border: 1px solid var(--border-subtle);
    }

    .role-normal-box .text-secondary {
      color: var(--secondary);
    }

    .actions-cluster {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .telemetry-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-md);
      background: var(--surface-low);
      border: 1px solid var(--border-subtle);
    }

    .beacon-wrap {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 0.65rem;
      height: 0.65rem;
    }

    .beacon-ping {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background-color: var(--secondary);
      opacity: 0.75;
      animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    .beacon-dot {
      position: relative;
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background-color: var(--secondary);
    }

    @keyframes ping {
      75%, 100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    .telemetry-text {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }

    .telemetry-status {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--secondary);
    }

    .telemetry-sub {
      font-family: var(--font-mono);
      font-size: 0.625rem;
      color: var(--text-outline);
    }

    .admin-btn {
      border-color: rgba(14, 165, 233, 0.3);
    }

    .user-profile-cluster {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding-left: 0.4rem;
    }

    .user-avatar-circle {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-full);
      background-color: var(--primary);
      color: var(--on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px rgba(137, 206, 255, 0.3);
    }

    .user-avatar-circle .material-symbols-outlined {
      font-size: 18px;
    }

    .user-text-meta {
      display: flex;
      flex-direction: column;
      text-align: right;
    }

    .user-email-header {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-role-sub {
      font-family: var(--font-mono);
      font-size: 0.625rem;
      color: var(--text-muted);
    }

    .btn-logout {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.4rem;
      border-radius: var(--radius-md);
      transition: all var(--duration-fast) var(--ease-out);
    }

    .btn-logout:hover {
      background-color: var(--error-container);
      color: var(--error);
    }

    @media (max-width: 900px) {
      .role-center-cluster {
        display: none;
      }
      .telemetry-badge {
        display: none;
      }
      .user-text-meta {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  readonly supabase = inject(SupabaseService);
  readonly theme = inject(ThemeService);

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openUsers = new EventEmitter<void>();
  @Output() openAuth = new EventEmitter<void>();
}
