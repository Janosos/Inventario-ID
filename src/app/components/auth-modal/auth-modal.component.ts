import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-backdrop-enter" (click)="onBackdropClick($event)">
      <div class="modal-card animate-modal-enter" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-titles">
            <h2 class="modal-title">{{ isRegister() ? 'Crear Cuenta' : 'Iniciar Sesión' }}</h2>
            <p class="modal-subtitle">Acceso seguro a Inventario-ID</p>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="close.emit()" aria-label="Cerrar modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Role Info Banner -->
        <div class="role-explain-box">
          <div class="role-explain-item">
            <span class="badge badge-admin">Rol Admin</span>
            <p>Gestión completa: agregar equipos, editar especificaciones, subir fotografías y gestionar usuarios.</p>
          </div>
          <div class="role-explain-item">
            <span class="badge badge-normal">Rol Normal</span>
            <p>Solo lectura: consultar catálogo, buscar por Service Tag, filtrar y ver fotos.</p>
          </div>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="modal-body">
            @if (isRegister()) {
              <div class="form-group">
                <label class="form-label" for="auth-name">Nombre Completo</label>
                <input 
                  id="auth-name" 
                  type="text" 
                  [(ngModel)]="fullName" 
                  name="fullName" 
                  placeholder="Tu nombre y apellido" />
              </div>
            }

            <div class="form-group">
              <label class="form-label" for="auth-email">Correo Electrónico <span class="required">*</span></label>
              <input 
                id="auth-email" 
                type="email" 
                [(ngModel)]="email" 
                name="email" 
                placeholder="usuario@ejemplo.com" 
                required />
            </div>

            <div class="form-group">
              <label class="form-label" for="auth-pass">Contraseña <span class="required">*</span></label>
              <input 
                id="auth-pass" 
                type="password" 
                [(ngModel)]="password" 
                name="password" 
                placeholder="Mínimo 6 caracteres" 
                minlength="6" 
                required />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-ghost btn-sm switch-tab-btn" (click)="isRegister.set(!isRegister())">
              {{ isRegister() ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate' }}
            </button>

            <button type="submit" class="btn btn-primary" [disabled]="loading() || !email || !password">
              @if (loading()) {
                <span class="spinner-sm"></span> Procesando...
              } @else {
                <span>{{ isRegister() ? 'Registrarme' : 'Entrar' }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-modal);
      overflow: hidden;
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
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
      font-size: 1.15rem;
      font-weight: 700;
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .role-explain-box {
      background-color: var(--bg-muted);
      border-bottom: 1px solid var(--border-subtle);
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .role-explain-item {
      display: flex;
      align-items: baseline;
      gap: 0.65rem;
    }

    .role-explain-item p {
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.35;
      margin: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
    }

    .modal-body {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .required {
      color: var(--accent-rose);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background-color: var(--bg-surface);
    }

    .switch-tab-btn {
      font-size: 0.775rem;
      padding: 0.3rem 0;
    }

    .spinner-sm {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AuthModalComponent {
  readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();

  readonly isRegister = signal<boolean>(false);
  readonly loading = signal<boolean>(false);

  email = '';
  password = '';
  fullName = '';

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    try {
      if (this.isRegister()) {
        const { error } = await this.supabase.signUp(this.email, this.password, this.fullName);
        if (error) {
          this.toast.error('Error al registrar usuario', error.message);
        } else {
          this.toast.success(
            '¡Registro exitoso!',
            'Tu cuenta ha sido creada. Si eres el primer usuario, se te ha otorgado el rol de Administrador.'
          );
          this.close.emit();
        }
      } else {
        const { error } = await this.supabase.signIn(this.email, this.password);
        if (error) {
          this.toast.error('Error de autenticación', error.message);
        } else {
          this.toast.success('Sesión iniciada', `Bienvenido ${this.supabase.currentProfile()?.full_name || this.email}`);
          this.close.emit();
        }
      }
    } catch (err: any) {
      this.toast.error('Error', err.message);
    } finally {
      this.loading.set(false);
    }
  }
}
