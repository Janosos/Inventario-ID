import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryItem, ItemCategory, ItemStatus, InventoryStats } from '../../core/models/inventory.model';
import { SupabaseService } from '../../core/services/supabase.service';
import { ToastService } from '../../core/services/toast.service';
import { InventoryModalComponent } from '../inventory-modal/inventory-modal.component';
import { PhotoManagerComponent } from '../photo-manager/photo-manager.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryModalComponent, PhotoManagerComponent],
  template: `
    <div class="dashboard-container">
      <!-- KPI & Telemetry Header Grid -->
      <section class="telemetry-grid">
        <!-- KPI Card 1: Total Equipos -->
        <div class="telemetry-card group">
          <div class="telemetry-glow glow-blue"></div>
          <div class="telemetry-card-top">
            <div class="telemetry-info">
              <span class="telemetry-label">TOTAL EQUIPOS</span>
              <div class="telemetry-value-row">
                <span class="telemetry-metric">{{ stats().totalUnits }}</span>
                <span class="telemetry-trend text-secondary">
                  <span class="material-symbols-outlined icon-14">arrow_upward</span>+{{ stats().totalItems }}
                </span>
              </div>
              <span class="telemetry-sub">{{ stats().totalItems }} registros activos globales</span>
            </div>
            <div class="telemetry-icon-box box-blue">
              <span class="material-symbols-outlined text-primary">devices_other</span>
            </div>
          </div>
        </div>

        <!-- KPI Card 2: Laptops / Portatiles -->
        <div class="telemetry-card group">
          <div class="telemetry-glow glow-indigo"></div>
          <div class="telemetry-card-top">
            <div class="telemetry-info">
              <span class="telemetry-label">LAPTOPS / PORTÁTILES</span>
              <div class="telemetry-value-row">
                <span class="telemetry-metric">{{ stats().laptops }}</span>
                <span class="telemetry-unit">unidades</span>
              </div>
              <span class="telemetry-sub">Equipos portátiles</span>
            </div>
            <div class="telemetry-icon-box box-indigo">
              <span class="material-symbols-outlined text-primary">laptop_mac</span>
            </div>
          </div>
        </div>

        <!-- KPI Card 3: Monitores -->
        <div class="telemetry-card group">
          <div class="telemetry-glow glow-amber"></div>
          <div class="telemetry-card-top">
            <div class="telemetry-info">
              <span class="telemetry-label">MONITORES</span>
              <div class="telemetry-value-row">
                <span class="telemetry-metric">{{ stats().monitors }}</span>
                <span class="telemetry-unit">unidades</span>
              </div>
              <span class="telemetry-sub">Pantallas y displays</span>
            </div>
            <div class="telemetry-icon-box box-amber">
              <span class="material-symbols-outlined text-tertiary">monitor</span>
            </div>
          </div>
        </div>

        <!-- KPI Card 4: Disponibles en Almacén -->
        <div class="telemetry-card group">
          <div class="telemetry-glow glow-emerald"></div>
          <div class="telemetry-card-top">
            <div class="telemetry-info">
              <span class="telemetry-label">DISPONIBLES INMEDIATOS</span>
              <div class="telemetry-value-row">
                <span class="telemetry-metric text-secondary">{{ stats().available }}</span>
                <span class="telemetry-unit text-secondary">/ {{ stats().totalUnits }}</span>
              </div>
              <span class="telemetry-sub">En almacén / Listos</span>
            </div>
            <div class="telemetry-icon-box box-emerald">
              <span class="material-symbols-outlined text-secondary">task_alt</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Master Toolbar: Search, Filters, View Modes & Actions -->
      <section class="master-toolbar">
        <!-- Search Field with Hotkey Badge -->
        <div class="search-box-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            id="equipmentSearch"
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Buscar por equipo, Service Tag (ST), Gorilla, especificación o custodio..." 
            class="toolbar-input" />
          @if (searchQuery) {
            <button class="clear-btn" (click)="searchQuery = ''" title="Limpiar búsqueda">
              <span class="material-symbols-outlined icon-16">close</span>
            </button>
          }
          <div class="hotkey-chip" (click)="focusSearch()">
            <kbd>⌘</kbd><span>K</span>
          </div>
        </div>

        <!-- Categories Filter Tabs -->
        <div class="category-tabs-scroll">
          <button 
            type="button"
            class="cat-tab" 
            [class.active]="selectedCategory() === 'Todos'" 
            (click)="selectedCategory.set('Todos')">
            Todos <span class="cat-count">({{ stats().totalUnits }})</span>
          </button>
          <button 
            type="button"
            class="cat-tab" 
            [class.active]="selectedCategory() === 'Laptop'" 
            (click)="selectedCategory.set('Laptop')">
            Laptops <span class="cat-count">({{ stats().laptops }})</span>
          </button>
          <button 
            type="button"
            class="cat-tab" 
            [class.active]="selectedCategory() === 'Monitor'" 
            (click)="selectedCategory.set('Monitor')">
            Monitores <span class="cat-count">({{ stats().monitors }})</span>
          </button>
          <button 
            type="button"
            class="cat-tab" 
            [class.active]="selectedCategory() === 'Desktop'" 
            (click)="selectedCategory.set('Desktop')">
            Desktops <span class="cat-count">({{ stats().desktops }})</span>
          </button>
          <button 
            type="button"
            class="cat-tab" 
            [class.active]="selectedCategory() === 'Accesorio'" 
            (click)="selectedCategory.set('Accesorio')">
            Accesorios <span class="cat-count">({{ stats().accessories }})</span>
          </button>
        </div>

        <!-- Action Cluster -->
        <div class="actions-cluster">
          <!-- View Mode Switcher -->
          <div class="view-switch-box">
            <button 
              type="button"
              class="switch-btn" 
              [class.active]="viewMode() === 'grid'" 
              (click)="viewMode.set('grid')" 
              title="Vista de Cuadrícula">
              <span class="material-symbols-outlined icon-18">grid_view</span>
            </button>
            <button 
              type="button"
              class="switch-btn" 
              [class.active]="viewMode() === 'table'" 
              (click)="viewMode.set('table')" 
              title="Vista de Tabla Densa">
              <span class="material-symbols-outlined icon-18">view_list</span>
            </button>
          </div>

          <!-- Export Action (Admin Only) -->
          @if (supabase.isAdmin()) {
            <button type="button" class="btn btn-secondary btn-sm" (click)="exportToCSV()" title="Exportar inventario CSV">
              <span class="material-symbols-outlined icon-18">file_download</span>
              <span class="btn-text">Exportar CSV</span>
            </button>
          }

          <!-- New Equipment Action (Admin Only) -->
          @if (supabase.isAdmin()) {
            <button type="button" class="btn btn-primary btn-sm btn-glow" (click)="openCreateModal()">
              <span class="material-symbols-outlined icon-20">add</span>
              <span class="btn-text">Nuevo Equipo</span>
            </button>
          }
        </div>
      </section>

      <!-- Equipment Content Area -->
      @if (loading()) {
        <div class="state-container">
          <div class="spinner"></div>
          <span class="state-msg">Cargando inventario de infraestructura TI...</span>
        </div>
      } @else if (filteredItems().length === 0) {
        <div class="state-container empty-state">
          <span class="material-symbols-outlined state-icon">search_off</span>
          <h3 class="state-title">No se encontraron activos</h3>
          <p class="state-desc">Intenta con otros términos de búsqueda como Service Tag (ej. '1T0KP12') o categoría 'Monitores'.</p>
          <button type="button" class="btn btn-secondary btn-sm mt-3" (click)="resetFilters()">
            Limpiar filtros
          </button>
        </div>
      } @else {
        <!-- Equipment Grid Catalog (Primary View) -->
        @if (viewMode() === 'grid') {
          <section class="equipment-grid">
            @for (item of filteredItems(); track item.id) {
              <article class="asset-card group">
                <!-- Top Accent Gradient Line -->
                <div class="card-accent-bar" [ngClass]="getAccentClass(item)"></div>

                <div class="card-inner">
                  <!-- Category & State Header -->
                  <div class="card-header-row">
                    <div class="cat-pill-wrap">
                      <span class="badge-cat" [ngClass]="getCategoryBadgeClass(item)">
                        {{ item.category }}
                      </span>
                      @if (item.quantity > 1) {
                        <span class="badge-quantity">{{ item.quantity }} unidades</span>
                      }
                    </div>

                    <div class="badge-status" [ngClass]="'status-' + item.status">
                      <span class="status-dot"></span>
                      <span class="status-name">{{ formatStatus(item.status) }}</span>
                    </div>
                  </div>

                  <!-- Model & Subtitle -->
                  <div class="card-title-wrap">
                    <h2 class="asset-model-name group-hover:text-primary">
                      {{ item.name }}
                    </h2>
                    <p class="asset-model-sub">{{ item.brand }} {{ item.model || 'Estación TI Corporativa' }}</p>
                  </div>

                  <!-- Identifiers Row (Service Tag + Gorilla ID / Lote) -->
                  <div class="identifiers-cluster">
                    @if (item.service_tag) {
                      <button 
                        type="button"
                        class="id-chip st-chip group/btn" 
                        (click)="copyToClipboard(item.service_tag, 'Service Tag')" 
                        title="Copiar Service Tag">
                        <span class="id-label">ST:</span>
                        <span class="id-val font-mono text-primary">{{ item.service_tag }}</span>
                        <span class="material-symbols-outlined icon-14 chip-copy-icon">content_copy</span>
                      </button>
                    }

                    @if (item.gorilla_tag) {
                      <button 
                        type="button"
                        class="id-chip gorilla-chip group/btn" 
                        (click)="copyToClipboard(item.gorilla_tag, 'Gorilla ID')" 
                        title="Copiar Gorilla ID">
                        <span class="id-label">Gorilla:</span>
                        <span class="id-val font-mono text-tertiary">{{ item.gorilla_tag }}</span>
                        <span class="material-symbols-outlined icon-14 chip-copy-icon">content_copy</span>
                      </button>
                    }

                    @if (!item.service_tag && !item.gorilla_tag && item.location) {
                      <div class="id-chip location-chip">
                        <span class="material-symbols-outlined icon-14 text-tertiary">shelves</span>
                        <span class="id-val font-mono text-tertiary">{{ item.location }}</span>
                      </div>
                    }
                  </div>

                  <!-- Technical Specs Well (Level -1 Sunken Box) -->
                  @if (item.specifications) {
                    <div class="specs-well">
                      <div class="specs-well-header">
                        <span class="material-symbols-outlined icon-15" [ngClass]="item.category === 'Monitor' ? 'text-tertiary' : 'text-primary'">
                          {{ item.category === 'Monitor' ? 'tv' : 'memory' }}
                        </span>
                        <span class="specs-well-label">ESPECIFICACIONES</span>
                      </div>
                      <div class="specs-well-content font-mono">
                        {{ item.specifications }}
                      </div>
                    </div>
                  }

                  <!-- Observations / Notes -->
                  @if (item.observations) {
                    <div class="obs-row">
                      <span class="material-symbols-outlined icon-16 text-outline">info</span>
                      <p class="obs-text">
                        <span class="obs-prefix">Obs:</span> {{ item.observations }}
                      </p>
                    </div>
                  }

                  <!-- Media / Photos Row -->
                  <div class="media-row">
                    <div class="media-info">
                      <span class="material-symbols-outlined icon-16 text-outline">image</span>
                      <span class="media-text">{{ (item.photos?.length || 0) }} foto(s)</span>
                    </div>

                    @if (item.main_photo_url) {
                      <div class="mini-thumb" (click)="openPhotoManager(item)" title="Ver imagen ampliada">
                        <img [src]="item.main_photo_url" alt="Miniatura activo" />
                      </div>
                    }

                    <span class="audit-badge" [ngClass]="(item.photos?.length || 0) > 0 ? 'text-secondary' : 'text-outline'">
                      <span class="material-symbols-outlined icon-14">
                        {{ (item.photos?.length || 0) > 0 ? 'verified' : 'task_alt' }}
                      </span>
                      <span>{{ (item.photos?.length || 0) > 0 ? 'Auditado' : 'Verificado Almacén' }}</span>
                    </span>
                  </div>

                  <!-- Footer Actions Row -->
                  <div class="card-footer-actions">
                    <!-- Photo Action: Admin can upload/view; Normal user can ONLY view -->
                    @if (supabase.isAdmin()) {
                      <button 
                        type="button" 
                        class="btn btn-secondary btn-sm flex-1" 
                        (click)="openPhotoManager(item)">
                        <span class="material-symbols-outlined icon-18">add_a_photo</span>
                        <span>{{ (item.photos?.length || 0) > 0 ? 'Fotos (' + item.photos?.length + ')' : 'Subir Foto' }}</span>
                      </button>
                    } @else {
                      <button 
                        type="button" 
                        class="btn btn-secondary btn-sm flex-1" 
                        [disabled]="(item.photos?.length || 0) === 0"
                        (click)="openPhotoManager(item)">
                        <span class="material-symbols-outlined icon-18">image</span>
                        <span>{{ (item.photos?.length || 0) > 0 ? 'Ver Fotos (' + item.photos?.length + ')' : 'Sin Fotos' }}</span>
                      </button>
                    }

                    @if (supabase.isAdmin()) {
                      <button 
                        type="button" 
                        class="btn btn-secondary btn-icon-sm" 
                        (click)="openEditModal(item)" 
                        title="Editar Activo">
                        <span class="material-symbols-outlined icon-18">edit</span>
                      </button>

                      <button 
                        type="button" 
                        class="btn btn-danger btn-icon-sm" 
                        (click)="confirmDeleteItem(item)" 
                        title="Dar de baja / Desincorporar">
                        <span class="material-symbols-outlined icon-18">delete</span>
                      </button>
                    }
                  </div>
                </div>
              </article>
            }
          </section>
        }

        <!-- Dense Data Table Container (Toggled via Switcher) -->
        @if (viewMode() === 'table') {
          <section class="table-container">
            <table class="dense-table">
              <thead>
                <tr>
                  <th>Equipo & Modelo</th>
                  <th>Categoría</th>
                  <th>Identificadores</th>
                  <th>Especificaciones</th>
                  <th>Stock / Estado</th>
                  <th>Observaciones</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredItems(); track item.id) {
                  <tr class="table-row">
                    <td class="cell-primary font-semibold">
                      <div class="table-cell-title">
                        <span>{{ item.name }}</span>
                        <span class="table-cell-sub">{{ item.brand }} {{ item.model || '' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge-cat" [ngClass]="getCategoryBadgeClass(item)">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="font-mono text-cell-mono">
                      <div class="table-ids-wrap">
                        @if (item.service_tag) {
                          <span class="clickable-chip" (click)="copyToClipboard(item.service_tag, 'ST')" title="Copiar ST">
                            ST: <strong>{{ item.service_tag }}</strong>
                          </span>
                        }
                        @if (item.gorilla_tag) {
                          <span class="clickable-chip" (click)="copyToClipboard(item.gorilla_tag, 'Gorilla')" title="Copiar Gorilla">
                            G: <strong>{{ item.gorilla_tag }}</strong>
                          </span>
                        }
                        @if (!item.service_tag && !item.gorilla_tag) {
                          <span class="text-outline">{{ item.location || '—' }}</span>
                        }
                      </div>
                    </td>
                    <td class="cell-specs font-mono text-outline" [title]="item.specifications || ''">
                      {{ item.specifications || '—' }}
                    </td>
                    <td>
                      <span class="status-cell-tag" [ngClass]="'status-' + item.status">
                        {{ formatStatus(item.status) }} ({{ item.quantity }}u)
                      </span>
                    </td>
                    <td class="cell-obs text-outline" [title]="item.observations || ''">
                      {{ item.observations || '—' }}
                    </td>
                    <td class="text-right">
                      <div class="table-action-btns">
                        <button 
                          type="button" 
                          class="btn-table-action" 
                          [disabled]="!supabase.isAdmin() && (item.photos?.length || 0) === 0"
                          (click)="openPhotoManager(item)" 
                          [title]="supabase.isAdmin() ? 'Ver / Subir Fotos' : 'Ver Fotos'">
                          <span class="material-symbols-outlined icon-18">image</span>
                        </button>
                        @if (supabase.isAdmin()) {
                          <button type="button" class="btn-table-action hover-primary" (click)="openEditModal(item)" title="Editar Activo">
                            <span class="material-symbols-outlined icon-18">edit</span>
                          </button>
                          <button type="button" class="btn-table-action hover-error" (click)="confirmDeleteItem(item)" title="Dar de baja">
                            <span class="material-symbols-outlined icon-18">delete</span>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        }
      }

      <!-- Modals -->
      @if (showItemModal()) {
        <app-inventory-modal 
          [itemToEdit]="selectedItemForEdit()" 
          (close)="closeItemModal()" 
          (saved)="onItemSaved()">
        </app-inventory-modal>
      }

      @if (showPhotoModal() && selectedItemForPhotos()) {
        <app-photo-manager 
          [item]="selectedItemForPhotos()!" 
          (close)="closePhotoModal()" 
          (photosUpdated)="onPhotosUpdated()">
        </app-photo-manager>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      width: 100%;
    }

    /* TELEMETRY KPI GRID */
    .telemetry-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .telemetry-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1280px) {
      .telemetry-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .telemetry-card {
      position: relative;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background-color: var(--surface-low);
      border: 1px solid var(--border-subtle);
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      transition: all var(--duration-normal) var(--ease-out);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .telemetry-card:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
      border-color: var(--border-hover);
      transform: translateY(-2px);
    }

    .telemetry-glow {
      position: absolute;
      right: -2rem;
      top: -2rem;
      width: 7rem;
      height: 7rem;
      border-radius: 9999px;
      filter: blur(2rem);
      pointer-events: none;
      transition: all var(--duration-normal) var(--ease-out);
    }

    .glow-blue { background-color: rgba(137, 206, 255, 0.12); }
    .glow-indigo { background-color: rgba(14, 165, 233, 0.12); }
    .glow-amber { background-color: rgba(255, 185, 95, 0.12); }
    .glow-emerald { background-color: rgba(78, 222, 163, 0.15); }

    .telemetry-card:hover .glow-blue { background-color: rgba(137, 206, 255, 0.22); }
    .telemetry-card:hover .glow-indigo { background-color: rgba(14, 165, 233, 0.22); }
    .telemetry-card:hover .glow-amber { background-color: rgba(255, 185, 95, 0.22); }
    .telemetry-card:hover .glow-emerald { background-color: rgba(78, 222, 163, 0.25); }

    .telemetry-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .telemetry-info {
      display: flex;
      flex-direction: column;
    }

    .telemetry-label {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-outline);
    }

    .telemetry-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.45rem;
      margin-top: 0.25rem;
    }

    .telemetry-metric {
      font-family: var(--font-sans);
      font-size: 1.875rem;
      line-height: 2.25rem;
      letter-spacing: -0.03em;
      font-weight: 700;
      color: var(--text-primary);
    }

    .telemetry-trend {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      display: flex;
      align-items: center;
      font-weight: 600;
    }

    .telemetry-unit {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      color: var(--text-outline);
    }

    .telemetry-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }

    .telemetry-icon-box {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--radius-md);
      background-color: var(--surface-container);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-subtle);
    }

    .box-blue { box-shadow: 0 0 16px rgba(14, 165, 233, 0.2); }
    .box-indigo { box-shadow: 0 0 16px rgba(137, 206, 255, 0.15); }
    .box-amber { box-shadow: 0 0 16px rgba(255, 185, 95, 0.15); }
    .box-emerald { box-shadow: 0 0 16px rgba(78, 222, 163, 0.25); }


    /* MASTER TOOLBAR */
    .master-toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      background-color: var(--surface-low);
      border: 1px solid var(--border-subtle);
      padding: 0.875rem;
      border-radius: var(--radius-lg);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    @media (min-width: 1280px) {
      .master-toolbar {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .search-box-wrap {
      position: relative;
      flex: 1;
      min-width: 280px;
      max-width: 600px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 20px;
      pointer-events: none;
    }

    .toolbar-input {
      width: 100%;
      height: 2.75rem;
      padding-left: 2.5rem;
      padding-right: 4.75rem;
      border-radius: var(--radius-md);
      background-color: var(--surface-container);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
      font-size: 0.875rem;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .toolbar-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(137, 206, 255, 0.25);
    }

    .clear-btn {
      position: absolute;
      right: 3rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.25rem;
    }

    .hotkey-chip {
      position: absolute;
      right: 0.65rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.15rem 0.45rem;
      border-radius: var(--radius-sm);
      background-color: var(--surface-high);
      color: var(--text-muted);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      cursor: pointer;
      user-select: none;
      border: 1px solid var(--border-subtle);
    }

    .category-tabs-scroll {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    @media (min-width: 1280px) {
      .category-tabs-scroll {
        padding-bottom: 0;
      }
    }

    .cat-tab {
      padding: 0.5rem 0.875rem;
      border-radius: var(--radius-md);
      background-color: var(--surface-container);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--duration-fast) var(--ease-out);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .cat-tab:hover {
      background-color: var(--surface-high);
      color: var(--text-primary);
    }

    .cat-tab.active {
      background-color: var(--primary);
      color: var(--on-primary);
      font-weight: 600;
      border-color: var(--primary);
      box-shadow: 0 0 14px rgba(137, 206, 255, 0.3);
    }

    .cat-count {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      opacity: 0.85;
    }

    .actions-cluster {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      align-self: flex-end;
    }

    @media (min-width: 1280px) {
      .actions-cluster {
        align-self: center;
      }
    }

    .view-switch-box {
      display: flex;
      align-items: center;
      background-color: var(--surface-container);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.2rem;
      gap: 0.2rem;
    }

    .switch-btn {
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .switch-btn:hover {
      color: var(--text-primary);
    }

    .switch-btn.active {
      background-color: var(--surface-high);
      color: var(--primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .btn-glow {
      box-shadow: 0 0 16px rgba(14, 165, 233, 0.35);
    }

    .btn-text {
      white-space: nowrap;
    }

    /* ASSET GRID & CARDS */
    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1.25rem;
      align-items: start;
    }

    @media (min-width: 768px) {
      .equipment-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1536px) {
      .equipment-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .asset-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      background-color: var(--surface-low);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      transition: all var(--duration-fast) var(--ease-out);
      position: relative;
      overflow: hidden;
    }

    .asset-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.38);
      border-color: var(--border-hover);
    }

    .card-accent-bar {
      height: 0.375rem;
      width: 100%;
    }

    .accent-blue {
      background: linear-gradient(to right, var(--primary), var(--primary-container));
    }

    .accent-amber {
      background: linear-gradient(to right, var(--tertiary), #ffd59e);
    }

    .accent-indigo {
      background: linear-gradient(to right, #818cf8, #6366f1);
    }

    .card-inner {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .card-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .cat-pill-wrap {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .badge-cat {
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-laptop {
      background-color: rgba(137, 206, 255, 0.12);
      color: var(--primary);
    }

    .badge-monitor {
      background-color: rgba(255, 185, 95, 0.12);
      color: var(--tertiary);
    }

    .badge-desktop {
      background-color: rgba(167, 139, 250, 0.12);
      color: #c084fc;
    }

    .badge-accessory {
      background-color: rgba(148, 163, 184, 0.12);
      color: #cbd5e1;
    }

    .badge-quantity {
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      background-color: var(--surface-container);
      color: var(--text-primary);
      border: 1px solid var(--border-subtle);
    }

    .badge-status {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-disponible {
      background-color: rgba(78, 222, 163, 0.15);
      color: var(--secondary);
    }

    .status-en_uso {
      background-color: rgba(14, 165, 233, 0.15);
      color: var(--primary);
    }

    .status-mantenimiento {
      background-color: rgba(255, 185, 95, 0.15);
      color: var(--tertiary);
    }

    .status-para_piezas {
      background-color: rgba(168, 85, 247, 0.15);
      color: #c084fc;
    }

    .status-baja {
      background-color: rgba(255, 180, 171, 0.15);
      color: var(--error);
    }

    .status-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 9999px;
      background-color: currentColor;
    }

    .card-title-wrap {
      display: flex;
      flex-direction: column;
    }

    .asset-model-name {
      font-family: var(--font-sans);
      font-size: 1.125rem;
      line-height: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--text-primary);
      transition: color var(--duration-fast) var(--ease-out);
    }

    .asset-model-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.1rem;
    }

    .identifiers-cluster {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }

    .id-chip {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.6875rem;
      border: 1px solid transparent;
      cursor: pointer;
      user-select: none;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .st-chip {
      background-color: var(--surface-container);
      color: var(--text-primary);
      border-color: var(--border-subtle);
    }

    .st-chip:hover {
      background-color: var(--surface-high);
      border-color: var(--primary);
    }

    .gorilla-chip {
      background-color: rgba(255, 185, 95, 0.12);
      border-color: rgba(255, 185, 95, 0.25);
      color: var(--tertiary);
    }

    .gorilla-chip:hover {
      background-color: rgba(255, 185, 95, 0.22);
    }

    .location-chip {
      background-color: var(--surface-container-high);
      border-color: var(--border-subtle);
      color: var(--text-secondary);
      cursor: default;
    }

    .id-label {
      color: var(--text-outline);
    }

    .id-val {
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .chip-copy-icon {
      color: var(--text-outline);
      transition: color var(--duration-fast) var(--ease-out);
    }

    .id-chip:hover .chip-copy-icon {
      color: var(--text-primary);
    }

    /* SPECS SUNKEN WELL */
    .specs-well {
      border-radius: var(--radius-md);
      background-color: var(--surface-lowest);
      border: 1px solid rgba(0, 0, 0, 0.4);
      padding: 0.65rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
    }

    .specs-well-header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .specs-well-label {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }

    .specs-well-content {
      font-size: 0.75rem;
      line-height: 1.35;
      color: var(--text-secondary);
    }

    .obs-row {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      line-height: 1.35;
    }

    .obs-prefix {
      font-weight: 600;
      color: var(--text-outline);
    }

    .media-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.35rem;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .media-info {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .mini-thumb {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      cursor: pointer;
    }

    .mini-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .audit-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 500;
    }

    .card-footer-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-top: 0.5rem;
      margin-top: auto;
    }

    .flex-1 {
      flex: 1;
    }

    /* DENSE TABLE VIEW */
    .table-container {
      border-radius: var(--radius-lg);
      background-color: var(--surface-low);
      border: 1px solid var(--border-subtle);
      padding: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      overflow-x: auto;
    }

    .dense-table {
      width: 100%;
      text-align: left;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .dense-table th {
      padding: 0.75rem 1rem;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-outline);
      border-bottom: 1px solid var(--surface-high);
      white-space: nowrap;
    }

    .dense-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
      color: var(--text-primary);
    }

    .table-row:hover {
      background-color: rgba(255, 255, 255, 0.03);
    }

    .table-cell-title {
      display: flex;
      flex-direction: column;
    }

    .table-cell-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 400;
    }

    .table-ids-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      font-size: 0.75rem;
    }

    .clickable-chip {
      cursor: pointer;
    }

    .clickable-chip:hover {
      color: var(--primary);
    }

    .cell-specs, .cell-obs {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.8125rem;
    }

    .status-cell-tag {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .table-action-btns {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.25rem;
    }

    .btn-table-action {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .btn-table-action:hover {
      background-color: var(--surface-high);
      color: var(--text-primary);
    }

    .btn-table-action.hover-primary:hover {
      color: var(--primary);
    }

    .btn-table-action.hover-error:hover {
      background-color: var(--error-container);
      color: var(--error);
    }

    .text-right {
      text-align: right;
    }

    /* STATES & SPINNER */
    .state-container {
      padding: 3.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      text-align: center;
      border-radius: var(--radius-lg);
      background-color: var(--surface-low);
      border: 1px solid var(--border-subtle);
    }

    .state-icon {
      font-size: 48px;
      color: var(--text-outline);
    }

    .state-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .state-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 420px;
    }

    .state-msg {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .spinner {
      width: 2.25rem;
      height: 2.25rem;
      border: 3px solid var(--border-subtle);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .icon-14 { font-size: 14px; }
    .icon-15 { font-size: 15px; }
    .icon-16 { font-size: 16px; }
    .icon-18 { font-size: 18px; }
    .icon-20 { font-size: 20px; }
    .icon-22 { font-size: 22px; }
    .icon-24 { font-size: 24px; }
  `]
})
export class InventoryListComponent implements OnInit {
  readonly supabase = inject(SupabaseService);
  private readonly toast = inject(ToastService);

  readonly items = signal<InventoryItem[]>([]);
  readonly loading = signal<boolean>(true);

  searchQuery = '';
  readonly selectedCategory = signal<string>('Todos');
  readonly viewMode = signal<'grid' | 'table'>('grid');

  // Modal controls
  readonly showItemModal = signal<boolean>(false);
  readonly selectedItemForEdit = signal<InventoryItem | undefined>(undefined);
  readonly showPhotoModal = signal<boolean>(false);
  readonly selectedItemForPhotos = signal<InventoryItem | null>(null);

  // Computed filtered list
  readonly filteredItems = computed(() => {
    const list = this.items();
    const query = this.searchQuery.trim().toLowerCase();
    const cat = this.selectedCategory();

    return list.filter(item => {
      // Category filter
      if (cat !== 'Todos' && item.category !== cat) {
        return false;
      }

      // Query filter
      if (!query) return true;

      const matchName = item.name.toLowerCase().includes(query);
      const matchBrand = item.brand.toLowerCase().includes(query);
      const matchModel = (item.model || '').toLowerCase().includes(query);
      const matchST = (item.service_tag || '').toLowerCase().includes(query);
      const matchGorilla = (item.gorilla_tag || '').toLowerCase().includes(query);
      const matchSpecs = (item.specifications || '').toLowerCase().includes(query);
      const matchObs = (item.observations || '').toLowerCase().includes(query);

      return matchName || matchBrand || matchModel || matchST || matchGorilla || matchSpecs || matchObs;
    });
  });

  // Computed summary metrics
  readonly stats = computed<InventoryStats>(() => {
    const list = this.items();
    const stats: InventoryStats = {
      totalItems: list.length,
      totalUnits: 0,
      laptops: 0,
      monitors: 0,
      desktops: 0,
      accessories: 0,
      available: 0,
      inUse: 0,
      maintenance: 0
    };

    for (const item of list) {
      const q = item.quantity || 1;
      stats.totalUnits += q;
      if (item.category === 'Laptop') stats.laptops += q;
      if (item.category === 'Monitor') stats.monitors += q;
      if (item.category === 'Desktop') stats.desktops += q;
      if (item.category === 'Accesorio') stats.accessories += q;

      if (item.status === 'disponible') stats.available += q;
      if (item.status === 'en_uso') stats.inUse += q;
      if (item.status === 'mantenimiento') stats.maintenance += q;
    }

    return stats;
  });

  async ngOnInit(): Promise<void> {
    await this.loadInventory();
  }

  async loadInventory(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.supabase.getInventory();
      this.items.set(data);
    } catch (err: any) {
      this.toast.error('Error cargando inventario', err.message);
    } finally {
      this.loading.set(false);
    }
  }

  focusSearch(): void {
    const input = document.getElementById('equipmentSearch') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategory.set('Todos');
  }

  getAccentClass(item: InventoryItem): string {
    switch (item.category) {
      case 'Laptop': return 'accent-blue';
      case 'Monitor': return 'accent-amber';
      case 'Desktop': return 'accent-indigo';
      default: return 'accent-blue';
    }
  }

  getCategoryBadgeClass(item: InventoryItem): string {
    switch (item.category) {
      case 'Laptop': return 'badge-laptop';
      case 'Monitor': return 'badge-monitor';
      case 'Desktop': return 'badge-desktop';
      default: return 'badge-accessory';
    }
  }

  openCreateModal(): void {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede registrar nuevos equipos.');
      return;
    }
    this.selectedItemForEdit.set(undefined);
    this.showItemModal.set(true);
  }

  openEditModal(item: InventoryItem): void {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede editar equipos.');
      return;
    }
    this.selectedItemForEdit.set(item);
    this.showItemModal.set(true);
  }

  closeItemModal(): void {
    this.showItemModal.set(false);
    this.selectedItemForEdit.set(undefined);
  }

  onItemSaved(): void {
    this.loadInventory();
  }

  openPhotoManager(item: InventoryItem): void {
    this.selectedItemForPhotos.set(item);
    this.showPhotoModal.set(true);
  }

  closePhotoModal(): void {
    this.showPhotoModal.set(false);
    this.selectedItemForPhotos.set(null);
  }

  onPhotosUpdated(): void {
    this.loadInventory();
  }

  async confirmDeleteItem(item: InventoryItem): Promise<void> {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador puede eliminar equipos.');
      return;
    }

    if (!confirm(`¿Confirmas que deseas dar de baja o desincorporar el activo [${item.service_tag || item.name}]? Esta acción genera registro de auditoría.`)) {
      return;
    }

    const { error } = await this.supabase.deleteItem(item.id);
    if (error) {
      this.toast.error('Error al eliminar', error.message);
    } else {
      this.toast.info('Activo desincorporado', `Activo ${item.service_tag || item.name} movido a histórico de bajas.`);
      this.loadInventory();
    }
  }

  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Copiado al portapapeles', `${label}: ${text}`);
    }).catch(() => {
      this.toast.info('Copiado', text);
    });
  }

  formatStatus(status: ItemStatus): string {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'en_uso': return 'En Uso';
      case 'mantenimiento': return 'Mantenimiento';
      case 'para_piezas': return 'Para piezas';
      case 'baja': return 'Baja';
      default: return status;
    }
  }

  exportToCSV(): void {
    if (!this.supabase.isAdmin()) {
      this.toast.error('Acceso denegado', 'Solo el Administrador tiene permisos para exportar información.');
      return;
    }

    const data = this.filteredItems();
    if (data.length === 0) {
      this.toast.warning('Sin datos', 'No hay equipos para exportar.');
      return;
    }

    const headers = ['ID', 'Equipo', 'Categoria', 'Marca', 'Modelo', 'Service_Tag', 'Gorilla_Tag', 'Especificaciones', 'Observaciones', 'Cantidad', 'Estado', 'Ubicacion'];
    const rows = data.map(item => [
      `"${item.id}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.brand}"`,
      `"${(item.model || '').replace(/"/g, '""')}"`,
      `"${(item.service_tag || '').replace(/"/g, '""')}"`,
      `"${(item.gorilla_tag || '').replace(/"/g, '""')}"`,
      `"${(item.specifications || '').replace(/"/g, '""')}"`,
      `"${(item.observations || '').replace(/"/g, '""')}"`,
      item.quantity,
      `"${item.status}"`,
      `"${(item.location || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario-equipos-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Reporte CSV generado', `Descarga iniciada: ${data.length} activos TI exportados.`);
  }
}
