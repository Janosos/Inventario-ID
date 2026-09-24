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
      max-width: 480px;
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
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      background-color: #161922;
    }

    .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background-color: #161922;
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
      color: var(--error);
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background-color: #1f2430;
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

    @media (max-width: 640px) {
      .modal-backdrop {
        padding: 0.75rem;
      }

      .modal-card {
        max-width: 100%;
      }

      .modal-header {
        padding: 1rem 1.25rem;
      }

      .modal-body {
        padding: 1.25rem;
      }

      .modal-footer {
        padding: 0.85rem 1.25rem;
        flex-direction: column-reverse;
        gap: 0.75rem;
        align-items: stretch;
      }

      .modal-footer .btn {
        width: 100%;
        justify-content: center;
      }
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
