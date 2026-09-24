import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryItem, ItemCategory, ItemStatus } from '../../core/models/inventory.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-inventory-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop animate-backdrop-enter" (click)="onBackdropClick($event)">
      <div class="modal-card animate-modal-enter" role="dialog" aria-modal="true">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-titles">
            <h2 class="modal-title">{{ isEdit ? 'Editar Equipo de Cómputo' : 'Registrar Nuevo Equipo' }}</h2>
            <p class="modal-subtitle">Control de activos, Service Tags y especificaciones técnicas</p>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="close.emit()" aria-label="Cerrar modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Form Body -->
        <form (ngSubmit)="onSubmit()" class="modal-form">
          <div class="modal-body">
            <!-- Row 1: Name and Category -->
            <div class="form-row grid-2">
              <div class="form-group">
                <label class="form-label" for="item-name">Nombre / Equipo <span class="required">*</span></label>
                <input 
                  id="item-name" 
                  type="text" 
                  [(ngModel)]="formData.name" 
                  name="name" 
                  placeholder="Ej. Dell Latitude E5440" 
                  required />
              </div>

              <div class="form-group">
                <label class="form-label" for="item-category">Categoría <span class="required">*</span></label>
                <select id="item-category" [(ngModel)]="formData.category" name="category" required>
                  <option value="Laptop">Laptop</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Desktop">Desktop / Torre</option>
                  <option value="Accesorio">Accesorio / Periférico</option>
                  <option value="Servidor">Servidor</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <!-- Row 2: Brand and Model -->
            <div class="form-row grid-2">
              <div class="form-group">
                <label class="form-label" for="item-brand">Marca <span class="required">*</span></label>
                <input 
                  id="item-brand" 
                  type="text" 
                  [(ngModel)]="formData.brand" 
                  name="brand" 
                  placeholder="Ej. Dell" 
                  required />
              </div>

              <div class="form-group">
                <label class="form-label" for="item-model">Modelo</label>
                <input 
                  id="item-model" 
                  type="text" 
                  [(ngModel)]="formData.model" 
                  name="model" 
                  placeholder="Ej. Latitude E5440 o P2210t" />
              </div>
            </div>

            <!-- Row 3: Service Tag (ST) and Gorilla Tag -->
            <div class="form-row grid-2">
              <div class="form-group">
                <label class="form-label" for="item-st">
                  Service Tag (ST)
                  <span class="label-hint">Número de serie Dell</span>
                </label>
                <input 
                  id="item-st" 
                  type="text" 
                  [(ngModel)]="formData.service_tag" 
                  name="service_tag" 
                  placeholder="Ej. 1T0KP12 o 7CJZN32" 
                  class="font-mono text-uppercase" />
              </div>

              <div class="form-group">
                <label class="form-label" for="item-gorilla">
                  Etiqueta Gorilla
                  <span class="label-hint">Código de control interno</span>
                </label>
                <input 
                  id="item-gorilla" 
                  type="text" 
                  [(ngModel)]="formData.gorilla_tag" 
                  name="gorilla_tag" 
                  placeholder="Ej. 1904 o 2376" 
                  class="font-mono text-uppercase" />
              </div>
            </div>

            <!-- Row 4: Specifications -->
            <div class="form-group">
              <label class="form-label" for="item-specs">
                Especificaciones Técnicas
                <span class="label-hint">Procesador, RAM, Almacenamiento, Pantalla</span>
              </label>
              <textarea 
                id="item-specs" 
                [(ngModel)]="formData.specifications" 
                name="specifications" 
                rows="2" 
                placeholder="Ej. i5 4ta 8gb 120 HDD o i5 4ta 8gb 128 HDD"></textarea>
            </div>

            <!-- Row 5: Observations -->
            <div class="form-group">
              <label class="form-label" for="item-obs">
                Observaciones y Accesorios
                <span class="label-hint">Cargadores, cables, detalles estéticos</span>
              </label>
              <textarea 
                id="item-obs" 
                [(ngModel)]="formData.observations" 
                name="observations" 
                rows="2" 
                placeholder="Ej. Cuenta con cargador. Requiere/tiene foto."></textarea>
            </div>

            <!-- Row 6: Quantity, Status, Location -->
            <div class="form-row grid-3">
              <div class="form-group">
                <label class="form-label" for="item-qty">Cantidad</label>
                <input 
                  id="item-qty" 
                  type="number" 
                  [(ngModel)]="formData.quantity" 
                  name="quantity" 
                  min="1" 
                  required />
              </div>

              <div class="form-group">
                <label class="form-label" for="item-status">Estado</label>
                <select id="item-status" [(ngModel)]="formData.status" name="status" required>
                  <option value="disponible">Disponible</option>
                  <option value="en_uso">En Uso</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="para_piezas">Para piezas</option>
                  <option value="baja">Baja</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="item-location">Ubicación</label>
                <input 
                  id="item-location" 
                  type="text" 
                  [(ngModel)]="formData.location" 
                  name="location" 
                  placeholder="Ej. Sistemas / Almacén" />
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="close.emit()" [disabled]="saving()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="saving() || !formData.name">
              @if (saving()) {
                <span class="spinner-sm"></span> Guardando...
              } @else {
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                <span>{{ isEdit ? 'Guardar Cambios' : 'Registrar Equipo' }}</span>
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
      max-width: 660px;
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

    .modal-form {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
      background-color: #161922;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      background-color: #161922;
    }

    .form-row {
      display: grid;
      gap: 1rem;
    }

    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
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
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .required {
      color: var(--error);
    }

    .label-hint {
      font-size: 0.7rem;
      font-weight: 400;
      color: var(--text-muted);
    }

    .text-uppercase {
      text-transform: uppercase;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background-color: #1f2430;
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
        padding: 0;
        align-items: flex-end;
      }

      .modal-card {
        max-height: 94vh;
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      }

      .modal-header {
        padding: 1rem 1.25rem;
      }

      .modal-body {
        padding: 1.15rem 1.25rem;
        gap: 0.85rem;
      }

      .grid-2, .grid-3 {
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .modal-footer {
        padding: 0.75rem 1.25rem;
      }

      .modal-footer .btn {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class InventoryModalComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  @Input() itemToEdit?: InventoryItem;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<InventoryItem>();

  readonly saving = signal<boolean>(false);

  formData: {
    name: string;
    category: ItemCategory;
    brand: string;
    model: string;
    service_tag: string;
    gorilla_tag: string;
    specifications: string;
    observations: string;
    quantity: number;
    status: ItemStatus;
    location: string;
    assigned_to: string;
  } = {
    name: '',
    category: 'Laptop',
    brand: 'Dell',
    model: '',
    service_tag: '',
    gorilla_tag: '',
    specifications: '',
    observations: '',
    quantity: 1,
    status: 'disponible',
    location: 'Sistemas / Almacén',
    assigned_to: ''
  };

  get isEdit(): boolean {
    return !!this.itemToEdit;
  }

  ngOnInit(): void {
    if (this.itemToEdit) {
      this.formData = {
        name: this.itemToEdit.name || '',
        category: this.itemToEdit.category || 'Laptop',
        brand: this.itemToEdit.brand || 'Dell',
        model: this.itemToEdit.model || '',
        service_tag: this.itemToEdit.service_tag || '',
        gorilla_tag: this.itemToEdit.gorilla_tag || '',
        specifications: this.itemToEdit.specifications || '',
        observations: this.itemToEdit.observations || '',
        quantity: this.itemToEdit.quantity ?? 1,
        status: this.itemToEdit.status || 'disponible',
        location: this.itemToEdit.location || 'Sistemas / Almacén',
        assigned_to: this.itemToEdit.assigned_to || ''
      };
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.formData.name.trim()) {
      this.toast.warning('Campo requerido', 'El nombre del equipo es obligatorio.');
      return;
    }

    this.saving.set(true);
    try {
      const cleanData = {
        name: this.formData.name.trim(),
        category: this.formData.category,
        brand: this.formData.brand.trim() || 'Dell',
        model: this.formData.model.trim() || null,
        service_tag: this.formData.service_tag.trim().toUpperCase() || null,
        gorilla_tag: this.formData.gorilla_tag.trim().toUpperCase() || null,
        specifications: this.formData.specifications.trim() || null,
        observations: this.formData.observations.trim() || null,
        quantity: Math.max(1, Number(this.formData.quantity) || 1),
        status: this.formData.status,
        location: this.formData.location.trim() || null,
        assigned_to: this.formData.assigned_to.trim() || null
      };

      if (this.isEdit && this.itemToEdit) {
        const validId = this.supabase.ensureValidUUID(this.itemToEdit.id);
        const { error } = await this.supabase.updateItem(validId, cleanData);
        if (error) {
          this.toast.error('Error al actualizar', error.message);
        } else {
          this.toast.success('Equipo actualizado', `"${cleanData.name}" se actualizó correctamente.`);
          this.saved.emit({ ...this.itemToEdit, ...cleanData, id: validId });
          this.close.emit();
        }
      } else {
        const { item, error } = await this.supabase.createItem({
          ...cleanData,
          main_photo_url: null,
          created_by: null
        });

        if (error) {
          this.toast.error('Error al registrar equipo', error.message);
        } else if (item) {
          this.toast.success('Equipo registrado', `"${item.name}" se agregó al inventario.`);
          this.saved.emit(item);
          this.close.emit();
        }
      }
    } catch (err: any) {
      this.toast.error('Error', err.message);
    } finally {
      this.saving.set(false);
    }
  }
}
