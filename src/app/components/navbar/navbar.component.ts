import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar-wrapper">
      <div class="navbar-container">
        <!-- Logo & Branding -->
        <div class="brand-group">
          <div class="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div class="brand-info">
            <div class="brand-title">
              <span>Inventario-ID</span>
              <span class="status-indicator status-online" title="Conectado a Supabase"></span>
            </div>
            <span class="brand-subtitle">Control de Equipos de Cómputo</span>
          </div>
        </div>

        <!-- Role Badge Area -->
        <div class="role-center-area">
          <div class="role-badge-container">
            <span class="role-label">Tu Rol:</span>
            @if (supabase.isAdmin()) {
              <span class="badge badge-admin">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
                ADMINISTRADOR
              </span>
            } @else {
              <span class="badge badge-normal">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                USUARIO NORMAL (Solo Lectura)
              </span>
            }
          </div>
        </div>

        <!-- Right Controls -->
        <div class="actions-group">
          <!-- Admin User Management Button -->
          @if (supabase.isAdmin()) {
            <button 
              class="btn btn-secondary btn-sm user-mgmt-btn"
              (click)="openUsers.emit()"
              title="Gestionar usuarios y crear cuentas de Administrador o Normal">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Gestionar Usuarios</span>
            </button>
          }

          <!-- Theme Toggle -->
          <button 
            class="btn btn-ghost btn-icon" 
            (click)="theme.toggleTheme()" 
            [attr.aria-label]="theme.currentTheme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            title="Cambiar tema">
            @if (theme.currentTheme() === 'dark') {
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            } @else {
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            }
          </button>

          <!-- Auth Button (Login / Logout) -->
          @if (supabase.currentUser()) {
            <div class="user-menu">
              <span class="user-email" [title]="supabase.currentUser()?.email">{{ supabase.currentUser()?.email }}</span>
              <button class="btn btn-ghost btn-sm" (click)="supabase.signOut()" title="Cerrar Sesión">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Salir</span>
              </button>
            </div>
          } @else {
            <button class="btn btn-primary btn-sm" (click)="openAuth.emit()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span>Acceder</span>
            </button>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      transition: background-color var(--duration-fast) var(--ease-out);
    }

    .navbar-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .brand-logo {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--brand-primary), var(--accent-indigo));
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px var(--brand-glow);
    }

    .brand-info {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      color: var(--text-primary);
    }

    .status-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--accent-emerald);
      display: inline-block;
      box-shadow: 0 0 8px var(--accent-emerald);
    }

    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .role-center-area {
      display: flex;
      align-items: center;
    }

    .role-badge-container {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background-color: var(--bg-muted);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid var(--border-subtle);
    }

    .role-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .actions-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .user-mgmt-btn {
      font-size: 0.775rem;
      border-color: rgba(99, 102, 241, 0.3);
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-muted);
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }

    .user-email {
      font-size: 0.775rem;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-secondary);
      font-family: var(--font-mono);
    }

    @media (max-width: 900px) {
      .role-center-area {
        display: none;
      }
      .brand-subtitle {
        display: none;
      }
    }
  `]
})
export class NavbarComponent {
  readonly supabase = inject(SupabaseService);
  readonly theme = inject(ThemeService);

  @Output() openUsers = new EventEmitter<void>();
  @Output() openAuth = new EventEmitter<void>();
}
