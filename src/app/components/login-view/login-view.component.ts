import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <!-- Ambient Glow Effects -->
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <!-- Theme Switcher Top Right -->
      <div class="theme-bar">
        <button 
          class="btn-theme" 
          (click)="theme.toggleTheme()" 
          [title]="theme.currentTheme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          <span class="material-symbols-outlined icon-20">
            {{ theme.currentTheme() === 'dark' ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>
      </div>

      <div class="login-card">
        <!-- Brand Header -->
        <div class="card-brand">
          <div class="logo-container">
            <img src="logo.png" alt="Inventario-ID Logo" class="login-logo-img" />
          </div>
          <h1 class="brand-title">Inventario-ID</h1>
          <p class="brand-subtitle">Control & Gestión IT Empresarial</p>
          <div class="telemetry-badge">
            <span class="pulse-dot"></span>
            <span>ACCESO AUTORIZADO TI</span>
          </div>
        </div>

        <!-- Mode Tabs -->
        <div class="auth-tabs">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="!isRegister()" 
            (click)="isRegister.set(false); errorMessage.set(null)">
            Iniciar Sesión
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="isRegister()" 
            (click)="isRegister.set(true); errorMessage.set(null)">
            Crear Cuenta
          </button>
        </div>

        <!-- Error Alert if any -->
        @if (errorMessage()) {
          <div class="alert-error">
            <span class="material-symbols-outlined icon-18">error</span>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="auth-form" autocomplete="on">
          @if (isRegister()) {
            <div class="form-group">
              <label class="form-label" for="reg-name">Nombre completo</label>
              <div class="input-wrap">
                <span class="material-symbols-outlined input-icon">badge</span>
                <input 
                  id="reg-name" 
                  type="text" 
                  [(ngModel)]="fullName" 
                  name="fullName" 
                  required 
                  placeholder="Ej. Ing. Carlos Mendoza" 
                  class="form-input" />
              </div>
            </div>
          }

          <div class="form-group">
            <label class="form-label" for="login-email">Correo corporativo</label>
            <div class="input-wrap">
              <span class="material-symbols-outlined input-icon">mail</span>
              <input 
                id="login-email" 
                type="email" 
                [(ngModel)]="email" 
                name="email" 
                required 
                autocomplete="email" 
                placeholder="usuario@empresa.com" 
                class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="login-pwd">Contraseña</label>
            <div class="input-wrap">
              <span class="material-symbols-outlined input-icon">lock</span>
              <input 
                id="login-pwd" 
                [type]="showPassword() ? 'text' : 'password'" 
                [(ngModel)]="password" 
                name="password" 
                required 
                autocomplete="current-password" 
                placeholder="••••••••••••" 
                class="form-input password-input" />
              <button 
                type="button" 
                class="pwd-toggle-btn" 
                (click)="showPassword.set(!showPassword())"
                [title]="showPassword() ? 'Ocultar contraseña' : 'Ver contraseña'">
                <span class="material-symbols-outlined icon-18">
                  {{ showPassword() ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn-submit" 
            [disabled]="loading() || !email || !password">
            @if (loading()) {
              <span class="spinner-sm"></span>
              <span>Validando credenciales...</span>
            } @else {
              <span class="material-symbols-outlined icon-20">
                {{ isRegister() ? 'how_to_reg' : 'login' }}
              </span>
              <span>{{ isRegister() ? 'Crear Cuenta y Acceder' : 'Acceder al Inventario' }}</span>
            }
          </button>
        </form>

        <!-- Information Footer -->
        <div class="card-footer-info">
          <div class="info-row">
            <span class="material-symbols-outlined text-secondary icon-16">verified</span>
            <span>Todos los activos y fotos se sincronizan en tiempo real para todos los usuarios.</span>
          </div>
          <div class="info-row">
            <span class="material-symbols-outlined text-primary icon-16">shield</span>
            <span>Edición y bajas exclusivas para cuenta Administrador.</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background-color: var(--bg-app);
      position: relative;
      overflow: hidden;
    }

    /* Ambient Glow Orbs */
    .glow-orb {
      position: absolute;
      border-radius: 9999px;
      filter: blur(80px);
      pointer-events: none;
      opacity: 0.28;
    }

    .orb-1 {
      top: 10%;
      left: 15%;
      width: 320px;
      height: 320px;
      background: radial-gradient(circle, var(--primary) 0%, rgba(14, 165, 233, 0) 70%);
    }

    .orb-2 {
      bottom: 10%;
      right: 15%;
      width: 380px;
      height: 380px;
      background: radial-gradient(circle, var(--secondary) 0%, rgba(78, 222, 163, 0) 70%);
    }

    .theme-bar {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 10;
    }

    .btn-theme {
      background: var(--surface-container);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .btn-theme:hover {
      background: var(--surface-high);
      color: var(--primary);
    }

    /* Login Card */
    .login-card {
      width: 100%;
      max-width: 440px;
      background-color: #1a1e29 !important;
      border: 1px solid var(--border-hover);
      border-radius: var(--radius-xl);
      padding: 2.25rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      position: relative;
      z-index: 5;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      animation: modalEnter var(--duration-modal) var(--ease-out) forwards;
    }

    :host-context(.light) .login-card {
      background-color: #ffffff !important;
      border-color: rgba(0, 0, 0, 0.1);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.12);
    }

    .card-brand {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.35rem;
    }

    .logo-container {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-logo-img {
      height: 4.25rem;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 0 16px rgba(137, 206, 255, 0.5));
      transition: transform var(--duration-normal) var(--ease-out);
    }

    .login-logo-img:hover {
      transform: scale(1.05);
    }

    :host-context(.light) .login-logo-img {
      filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7)) invert(1);
    }

    .brand-title {
      font-family: var(--font-sans);
      font-size: 1.625rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      color: var(--text-primary);
      margin: 0;
    }

    .brand-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
    }

    .telemetry-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 0.5rem;
      padding: 0.2rem 0.65rem;
      border-radius: var(--radius-full);
      background-color: var(--surface-container);
      border: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--primary);
      letter-spacing: 0.05em;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 9999px;
      background-color: var(--secondary);
      box-shadow: 0 0 8px var(--secondary);
      animation: pulse 1.8s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* Auth Tabs */
    .auth-tabs {
      display: flex;
      background-color: var(--surface-lowest);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .tab-btn {
      flex: 1;
      padding: 0.55rem;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
      text-align: center;
    }

    .tab-btn:hover {
      color: var(--text-primary);
    }

    .tab-btn.active {
      background-color: var(--surface-container);
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    }

    /* Form Elements */
    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.125rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .form-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.85rem;
      color: var(--text-muted);
      font-size: 19px;
      pointer-events: none;
    }

    .form-input {
      width: 100%;
      height: 2.75rem;
      padding-left: 2.6rem;
      padding-right: 1rem;
      border-radius: var(--radius-md);
      background-color: var(--surface-lowest);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
      font-size: 0.875rem;
      transition: all var(--duration-fast) var(--ease-out);
      outline: none;
    }

    .password-input {
      padding-right: 2.75rem;
    }

    .form-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(137, 206, 255, 0.25);
      background-color: var(--surface-container);
    }

    .pwd-toggle-btn {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem;
    }

    .pwd-toggle-btn:hover {
      color: var(--text-primary);
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      height: 2.875rem;
      margin-top: 0.35rem;
      border-radius: var(--radius-md);
      background-color: var(--primary);
      color: var(--on-primary);
      font-weight: 600;
      font-size: 0.875rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
      transition: all var(--duration-fast) var(--ease-out);
    }

    .btn-submit:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: translateY(-1px);
      box-shadow: 0 0 25px rgba(14, 165, 233, 0.55);
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Alert */
    .alert-error {
      background-color: rgba(255, 180, 171, 0.12);
      border: 1px solid rgba(255, 180, 171, 0.3);
      color: var(--error);
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Footer Info */
    .card-footer-info {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-subtle);
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.725rem;
      color: var(--text-muted);
      line-height: 1.35;
    }

    .spinner-sm {
      width: 1.1rem;
      height: 1.1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .icon-16 { font-size: 16px; }
    .icon-18 { font-size: 18px; }
    .icon-20 { font-size: 20px; }

    @media (max-width: 640px) {
      .login-wrapper {
        padding: 1rem;
      }
      .login-card {
        padding: 1.75rem 1.25rem;
        gap: 1.25rem;
      }
      .login-logo-img {
        height: 3.5rem;
      }
      .brand-title {
        font-size: 1.375rem;
      }
    }
  `]
})
export class LoginViewComponent {
  readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);
  readonly theme = inject(ThemeService);

  readonly isRegister = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  email = '';
  password = '';
  fullName = '';

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.errorMessage.set(null);
    this.loading.set(true);

    try {
      if (this.isRegister()) {
        const { error } = await this.supabase.signUp(this.email, this.password, this.fullName);
        if (error) {
          this.errorMessage.set(error.message);
          this.toast.error('Error al registrar usuario', error.message);
        } else {
          this.toast.success(
            '¡Registro completado!',
            'Tu cuenta ha sido creada exitosamente. Iniciando sesión...'
          );
        }
      } else {
        const { error } = await this.supabase.signIn(this.email, this.password);
        if (error) {
          let msg = error.message;
          if (msg.includes('Invalid login credentials')) {
            msg = 'Correo o contraseña incorrectos. Verifica tus credenciales.';
          }
          this.errorMessage.set(msg);
          this.toast.error('Acceso denegado', msg);
        } else {
          this.toast.success('Sesión iniciada', `Bienvenido al sistema`);
        }
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error inesperado al conectar.');
    } finally {
      this.loading.set(false);
    }
  }
}
