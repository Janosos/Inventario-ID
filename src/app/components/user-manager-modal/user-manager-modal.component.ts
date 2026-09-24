import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile, UserRole } from '../../core/models/inventory.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-user-manager-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-backdrop-enter" (click)="onBackdropClick($event)">
      <div class="modal-card animate-modal-enter" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-titles">
            <h2 class="modal-title">Gestión de Usuarios</h2>
            <p class="modal-subtitle">Crea y asigna roles a los usuarios del sistema (Administrador o Normal)</p>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="close.emit()" aria-label="Cerrar modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Create User Section -->
          <div class="create-user-box">
            <h3 class="box-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              <span>Crear Nuevo Usuario</span>
            </h3>

            <form (ngSubmit)="handleCreateUser()" class="create-form">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="new-email">Correo Electrónico <span class="required">*</span></label>
                  <input 
                    id="new-email" 
                    type="email" 
                    [(ngModel)]="newEmail" 
                    name="newEmail" 
                    placeholder="usuario@dominio.com" 
                    required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="new-name">Nombre Completo</label>
                  <input 
                    id="new-name" 
                    type="text" 
                    [(ngModel)]="newName" 
                    name="newName" 
                    placeholder="Ej. Juan Pérez" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="new-password">Contraseña Inicial <span class="required">*</span></label>
                  <input 
                    id="new-password" 
                    type="password" 
                    [(ngModel)]="newPassword" 
                    name="newPassword" 
                    placeholder="Mínimo 6 caracteres" 
                    minlength="6" 
                    required />
                </div>

                <div class="form-group">
                  <label class="form-label" for="new-role">Rol Asignado <span class="required">*</span></label>
                  <select id="new-role" [(ngModel)]="newRole" name="newRole" required>
                    <option value="normal">Usuario Normal (Solo lectura)</option>
                    <option value="admin">Administrador (Control total)</option>
                  </select>
                </div>
              </div>

              <div class="create-actions">
                <button type="submit" class="btn btn-primary btn-sm" [disabled]="isSubmitting() || !newEmail || !newPassword">
                  @if (isSubmitting()) {
                    <span class="spinner-sm"></span> Creando...
                  } @else {
                    <span>Registrar Usuario</span>
                  }
                </button>
              </div>
            </form>
          </div>

          <!-- Existing Users List -->
          <div class="users-list-section">
            <div class="list-header">
              <h3 class="box-title">Usuarios Registrados ({{ profiles().length }})</h3>
              <button class="btn btn-ghost btn-sm" (click)="loadProfiles()" [disabled]="isLoadingProfiles()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 2v6h-6"></path>
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                  <path d="M3 22v-6h6"></path>
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
                <span>Actualizar</span>
              </button>
            </div>

            @if (isLoadingProfiles()) {
              <div class="loading-state">
                <div class="spinner"></div>
                <span>Cargando usuarios...</span>
              </div>
            } @else if (profiles().length === 0) {
              <div class="empty-users">
                <p>No se encontraron perfiles de usuario.</p>
              </div>
            } @else {
              <div class="table-container">
                <table class="users-table">
                  <thead>
                    <tr>
                      <th>Usuario / Correo</th>
                      <th>Nombre</th>
                      <th>Rol Actual</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (user of profiles(); track user.id) {
                      <tr>
                        <td>
                          <span class="user-email-text">{{ user.email }}</span>
                          @if (user.id === supabase.currentUser()?.id) {
                            <span class="current-user-tag">(Tú)</span>
                          }
                        </td>
                        <td>{{ user.full_name || '—' }}</td>
                        <td>
                          @if (user.role === 'admin') {
                            <span class="badge badge-admin">Administrador</span>
                          } @else {
                            <span class="badge badge-normal">Usuario Normal</span>
                          }
                        </td>
                        <td>
                          @if (user.id !== supabase.currentUser()?.id) {
                            <button 
                              class="btn btn-secondary btn-sm"
                              (click)="toggleUserRole(user)"
                              [title]="'Cambiar a ' + (user.role === 'admin' ? 'Normal' : 'Admin')">
                              Convertir a {{ user.role === 'admin' ? 'Normal' : 'Admin' }}
                            </button>
                          } @else {
                            <span class="text-muted text-sm">Sesión activa</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close.emit()">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(5, 7, 12, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      max-width: 720px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background-color: #1a1e29 !important;
      border: 1px solid var(--border-hover);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      background-color: #1f2430;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background-color: #161922;
    }

    .box-title {
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
    }

    .create-user-box {
      background: #1a1e29;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .required {
      color: var(--error);
    }

    .create-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.25rem;
    }

    .users-list-section {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .table-container {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow-x: auto;
      background: #1a1e29;
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.825rem;
    }

    .users-table th {
      padding: 0.75rem 1rem;
      font-size: 0.725rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      background-color: #1f2430;
    }

    .users-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
      color: var(--text-secondary);
    }

    .users-table tbody tr:hover {
      background-color: rgba(255, 255, 255, 0.03);
    }

    .user-email-text {
      font-weight: 600;
      color: var(--text-primary);
    }

    .current-user-tag {
      font-size: 0.7rem;
      color: var(--primary);
      margin-left: 0.35rem;
      font-weight: 600;
    }

    .text-sm {
      font-size: 0.75rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      background-color: #1f2430;
    }

    .loading-state, .empty-users {
      padding: 2rem 1rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    .spinner-sm {
      width: 0.85rem;
      height: 0.85rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
      margin-right: 0.35rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserManagerModalComponent implements OnInit {
  readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();

  readonly profiles = signal<UserProfile[]>([]);
  readonly isLoadingProfiles = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  newEmail = '';
  newName = '';
  newPassword = '';
  newRole: UserRole = 'normal';

  async ngOnInit(): Promise<void> {
    await this.loadProfiles();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  async loadProfiles(): Promise<void> {
    this.isLoadingProfiles.set(true);
    try {
      const { profiles, error } = await this.supabase.getProfiles();
      if (error) {
        this.toast.error('Error al cargar perfiles', error.message);
      } else {
        this.profiles.set(profiles);
      }
    } finally {
      this.isLoadingProfiles.set(false);
    }
  }

  async handleCreateUser(): Promise<void> {
    if (!this.newEmail || !this.newPassword) return;

    this.isSubmitting.set(true);
    try {
      const { error, user } = await this.supabase.adminCreateUser(
        this.newEmail.trim(),
        this.newPassword,
        this.newName.trim(),
        this.newRole
      );

      if (error) {
        this.toast.error('Error al registrar usuario', error.message);
      } else {
        this.toast.success(
          'Usuario Creado',
          `Se registró "${this.newEmail}" con rol de ${this.newRole === 'admin' ? 'Administrador' : 'Usuario Normal'}.`
        );
        this.newEmail = '';
        this.newName = '';
        this.newPassword = '';
        this.newRole = 'normal';
        await this.loadProfiles();
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async toggleUserRole(user: UserProfile): Promise<void> {
    const nextRole: UserRole = user.role === 'admin' ? 'normal' : 'admin';
    const actionText = nextRole === 'admin' ? 'Administrador' : 'Usuario Normal';

    if (!confirm(`¿Deseas cambiar el rol de "${user.email}" a ${actionText}?`)) {
      return;
    }

    const { error } = await this.supabase.updateProfileRole(user.id, nextRole);
    if (error) {
      this.toast.error('Error al actualizar rol', error.message);
    } else {
      this.toast.success('Rol actualizado', `"${user.email}" ahora es ${actionText}.`);
      await this.loadProfiles();
    }
  }
}
