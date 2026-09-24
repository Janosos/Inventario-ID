import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryItem, ItemPhoto } from '../../core/models/inventory.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-photo-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop animate-backdrop-enter" (click)="onBackdropClick($event)">
      <div class="modal-card animate-modal-enter" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-titles">
            <h2 class="modal-title">Galería y Fotos del Equipo</h2>
            <p class="modal-subtitle">
              {{ item.name }}
              @if (item.service_tag) {
                <span class="badge badge-st">ST: {{ item.service_tag }}</span>
              }
              @if (item.gorilla_tag) {
                <span class="badge badge-gorilla">Gorilla: {{ item.gorilla_tag }}</span>
              }
            </p>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="close.emit()" aria-label="Cerrar modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Body Content -->
        <div class="modal-body">
          <!-- Upload Area (Admin Only) -->
          @if (supabase.isAdmin()) {
            <div 
              class="upload-dropzone" 
              [class.drag-over]="isDragging()"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)">
              
              <input 
                #fileInput 
                type="file" 
                accept="image/*" 
                class="sr-only" 
                (change)="onFileSelected($event)" 
                [disabled]="isUploading()" />

              <div class="dropzone-content" (click)="fileInput.click()">
                <div class="dropzone-icon">
                  @if (isUploading()) {
                    <div class="spinner"></div>
                  } @else {
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  }
                </div>
                <div class="dropzone-text">
                  <span class="dropzone-title">
                    {{ isUploading() ? 'Subiendo imagen...' : 'Arrastra una foto aquí o haz clic para seleccionar' }}
                  </span>
                  <span class="dropzone-rules">
                    Formatos JPG, PNG, WebP • <strong>Máximo 10 MB por foto</strong>
                  </span>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" [disabled]="isUploading()">
                  Explorar Archivos
                </button>
              </div>
            </div>
          }

          <!-- Photos Grid / Empty State -->
          <div class="photos-section">
            <div class="section-title-row">
              <h3>Fotos registradas ({{ itemPhotos.length }})</h3>
            </div>

            @if (itemPhotos.length === 0) {
              <div class="empty-photos">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Este equipo aún no tiene fotografías registradas.</p>
                @if (supabase.isAdmin()) {
                  <span>Usa el área superior para subir la primera foto (< 10 MB).</span>
                }
              </div>
            } @else {
              <div class="photos-grid">
                @for (photo of itemPhotos; track photo.id) {
                  <div class="photo-card" (click)="openLightbox(photo)">
                    <img [src]="photo.public_url" [alt]="photo.file_name" loading="lazy" />
                    <div class="photo-overlay">
                      <div class="photo-info">
                        <span class="photo-name">{{ photo.file_name }}</span>
                        <span class="photo-size">{{ formatSize(photo.file_size) }}</span>
                      </div>
                      <div class="photo-actions" (click)="$event.stopPropagation()">
                        <button class="btn btn-secondary btn-icon-sm" (click)="openLightbox(photo)" title="Ampliar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                          </svg>
                        </button>
                        @if (supabase.isAdmin()) {
                          <button class="btn btn-danger btn-icon-sm" (click)="confirmDeletePhoto(photo)" title="Eliminar foto">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
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

    <!-- Lightbox Fullscreen Viewer -->
    @if (activeLightboxPhoto()) {
      <div class="lightbox-backdrop animate-backdrop-enter" (click)="activeLightboxPhoto.set(null)">
        <div class="lightbox-container" (click)="$event.stopPropagation()">
          <button class="lightbox-close" (click)="activeLightboxPhoto.set(null)" aria-label="Cerrar vista completa">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img [src]="activeLightboxPhoto()?.public_url" [alt]="activeLightboxPhoto()?.file_name" class="lightbox-img" />
          <div class="lightbox-caption">
            <span>{{ activeLightboxPhoto()?.file_name }}</span>
            <span>{{ formatSize(activeLightboxPhoto()?.file_size || 0) }}</span>
          </div>
        </div>
      </div>
    }
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
      max-width: 780px;
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
      gap: 0.35rem;
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      background-color: #161922;
    }

    /* Dropzone Upload */
    .upload-dropzone {
      border: 2px dashed var(--border-hover);
      border-radius: var(--radius-lg);
      background-color: #1a1e29;
      padding: 1.5rem;
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .upload-dropzone:hover, .upload-dropzone.drag-over {
      border-color: var(--primary);
      background-color: rgba(14, 165, 233, 0.08);
    }

    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.75rem;
    }

    .dropzone-icon {
      width: 3.25rem;
      height: 3.25rem;
      border-radius: var(--radius-full);
      background-color: #1f2430;
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
    }

    .dropzone-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .dropzone-title {
      font-size: 0.925rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .dropzone-rules {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .section-title-row {
      margin-bottom: 0.75rem;
    }

    .section-title-row h3 {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .empty-photos {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      color: var(--text-muted);
      text-align: center;
      gap: 0.45rem;
      background-color: #1a1e29;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
    }

    .empty-photos p {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .empty-photos span {
      font-size: 0.775rem;
    }

    /* Grid of Photos */
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .photo-card {
      position: relative;
      aspect-ratio: 4 / 3;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      background-color: #1a1e29;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
    }

    .photo-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .photo-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 40%, rgba(0, 0, 0, 0.85) 100%);
      opacity: 0;
      transition: opacity var(--duration-fast) var(--ease-out);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 0.65rem;
    }

    .photo-card:hover .photo-overlay {
      opacity: 1;
    }

    .photo-info {
      display: flex;
      flex-direction: column;
      color: #ffffff;
      margin-bottom: 0.35rem;
    }

    .photo-name {
      font-size: 0.725rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .photo-size {
      font-size: 0.65rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .photo-actions {
      display: flex;
      gap: 0.35rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background-color: #1f2430;
    }

    /* Lightbox */
    .lightbox-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 300;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .lightbox-container {
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .lightbox-close {
      position: absolute;
      top: -2.5rem;
      right: 0;
      background: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 80vh;
      border-radius: var(--radius-md);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      object-fit: contain;
    }

    .lightbox-caption {
      margin-top: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.85rem;
      display: flex;
      gap: 1rem;
    }

    .spinner {
      width: 1.5rem;
      height: 1.5rem;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PhotoManagerComponent {
  readonly supabase = inject(SupabaseService);
  readonly toast = inject(ToastService);

  @Input({ required: true }) item!: InventoryItem;
  @Output() close = new EventEmitter<void>();
  @Output() photosUpdated = new EventEmitter<void>();

  readonly isUploading = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);
  readonly activeLightboxPhoto = signal<ItemPhoto | null>(null);

  get itemPhotos(): ItemPhoto[] {
    return this.item.photos || [];
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  onDragOver(event: DragEvent): void {
    if (!this.supabase.isAdmin()) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede subir fotos.');
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede subir fotos.');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
      input.value = '';
    }
  }

  async processFile(file: File): Promise<void> {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede subir fotos.');
      return;
    }

    // Validación de 10 MB estricta
    const MAX_MB = 10;
    const MAX_BYTES = MAX_MB * 1024 * 1024;

    if (file.size > MAX_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      this.toast.error(
        'Archivo demasiado pesado',
        `El archivo mide ${sizeMb} MB y excede el límite máximo de ${MAX_MB} MB.`
      );
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toast.error('Formato inválido', 'Por favor selecciona un archivo de imagen (JPG, PNG, WebP).');
      return;
    }

    this.isUploading.set(true);
    try {
      const { photo, error } = await this.supabase.uploadPhoto(this.item.id, file);
      if (error) {
        this.toast.error('Error al subir imagen', error.message);
      } else if (photo) {
        this.toast.success('Foto guardada', `Se cargó "${file.name}" exitosamente.`);
        this.item.photos = this.item.photos || [];
        this.item.photos.push(photo);
        if (!this.item.main_photo_url) {
          this.item.main_photo_url = photo.public_url;
        }
        this.photosUpdated.emit();
      }
    } catch (err: any) {
      this.toast.error('Error al procesar foto', err.message);
    } finally {
      this.isUploading.set(false);
    }
  }

  openLightbox(photo: ItemPhoto): void {
    this.activeLightboxPhoto.set(photo);
  }

  async confirmDeletePhoto(photo: ItemPhoto): Promise<void> {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede eliminar fotos.');
      return;
    }

    if (!confirm(`¿Eliminar la foto "${photo.file_name}"?`)) return;

    const { error } = await this.supabase.deletePhoto(photo, this.item.id);
    if (error) {
      this.toast.error('Error al eliminar foto', error.message);
    } else {
      this.toast.info('Foto eliminada');
      this.item.photos = (this.item.photos || []).filter(p => p.id !== photo.id);
      if (this.item.main_photo_url === photo.public_url) {
        this.item.main_photo_url = this.item.photos.length > 0 ? this.item.photos[0].public_url : null;
      }
      this.photosUpdated.emit();
    }
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return mb.toFixed(2) + ' MB';
    const kb = bytes / 1024;
    return kb.toFixed(1) + ' KB';
  }
}
