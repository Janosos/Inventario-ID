import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-backdrop-enter" (click)="onBackdropClick($event)">
      <div class="modal-card animate-modal-enter" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-titles">
            <h2 class="modal-title">Configuración de Supabase</h2>
            <p class="modal-subtitle">Conexión con el proyecto <strong>Inventario-ID</strong></p>
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
          <!-- Step 1: SQL Script reminder -->
          <div class="step-card">
            <div class="step-num">1</div>
            <div class="step-content">
              <h4>Ejecuta el Script SQL en Supabase</h4>
              <p>
                Abre tu proyecto en <strong>Supabase Dashboard -> SQL Editor</strong> y ejecuta el archivo
                <code>supabase/schema.sql</code> generado en la raíz del repositorio. Este script crea las tablas,
                roles, el bucket de fotos (máx 10 MB) y los equipos semilla.
              </p>
            </div>
          </div>

          <!-- Step 2: Credentials input -->
          <div class="step-card">
            <div class="step-num">2</div>
            <div class="step-content">
              <h4>Ingresa las credenciales API</h4>
              <p>
                Encuéntralas en <strong>Supabase Dashboard -> Project Settings -> API</strong>:
              </p>

              <div class="config-inputs">
                <div class="form-group">
                  <label class="form-label" for="cfg-url">Project URL</label>
                  <input 
                    id="cfg-url" 
                    type="text" 
                    [(ngModel)]="supabaseUrl" 
                    placeholder="https://tu-proyecto.supabase.co" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="cfg-key">Project API Anon Key (pública)</label>
                  <input 
                    id="cfg-key" 
                    type="password" 
                    [(ngModel)]="supabaseAnonKey" 
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
                </div>
              </div>
            </div>
          </div>

          <!-- Status Banner -->
          <div class="status-box" [class.status-connected]="supabase.isConfigured()">
            <div class="status-dot"></div>
            <div class="status-text">
              <strong>Estado actual:</strong>
              @if (supabase.isConfigured()) {
                <span>Conectado a Supabase correctamente. Los datos se sincronizan en la nube.</span>
              } @else {
                <span>Modo Demostración / Local activo. Puedes probar todas las funciones inmediatamente.</span>
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          @if (supabase.isConfigured()) {
            <button type="button" class="btn btn-danger btn-sm" (click)="disconnect()">
              Desconectar Supabase
            </button>
          }

          <div class="footer-right">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">
              Cerrar
            </button>
            <button type="button" class="btn btn-primary" (click)="saveCredentials()">
              Guardar y Conectar
            </button>
          </div>
        </div>
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
      max-width: 600px;
      max-height: 90vh;
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
      font-size: 1.2rem;
      font-weight: 700;
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
      gap: 1.25rem;
    }

    .step-card {
      display: flex;
      gap: 1rem;
      background: var(--bg-muted);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.15rem;
    }

    .step-num {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-full);
      background: var(--brand-primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .step-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .step-content h4 {
      font-size: 0.925rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .step-content p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.45;
    }

    .step-content code {
      background: var(--bg-surface);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.775rem;
      border: 1px solid var(--border-subtle);
    }

    .config-inputs {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.5rem;
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

    .status-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.15rem;
      background: var(--bg-muted);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      font-size: 0.8rem;
    }

    .status-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--accent-amber);
      flex-shrink: 0;
      box-shadow: 0 0 6px var(--accent-amber);
    }

    .status-connected .status-dot {
      background: var(--accent-emerald);
      box-shadow: 0 0 6px var(--accent-emerald);
    }

    .status-text {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
      color: var(--text-secondary);
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

    .footer-right {
      display: flex;
      gap: 0.75rem;
      margin-left: auto;
    }
  `]
})
export class ConfigModalComponent {
  readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();

  supabaseUrl = localStorage.getItem('inventario_supabase_url') || '';
  supabaseAnonKey = localStorage.getItem('inventario_supabase_anon_key') || '';

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  saveCredentials(): void {
    if (!this.supabaseUrl.trim() || !this.supabaseAnonKey.trim()) {
      this.toast.warning('Datos incompletos', 'Por favor ingresa la URL y la Anon Key de tu proyecto Supabase.');
      return;
    }

    const success = this.supabase.configureCredentials(this.supabaseUrl, this.supabaseAnonKey);
    if (success) {
      this.toast.success(
        'Supabase Configurado',
        'Las credenciales han sido guardadas. La app intentará conectarse automáticamente.'
      );
      this.close.emit();
    } else {
      this.toast.error('URL no válida', 'La URL debe comenzar con http:// o https://.');
    }
  }

  disconnect(): void {
    this.supabase.clearCredentials();
    this.supabaseUrl = '';
    this.supabaseAnonKey = '';
    this.toast.info('Supabase Desconectado', 'Has regresado al modo demostración local.');
  }
}
