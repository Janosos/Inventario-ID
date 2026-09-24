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
    <div class="inventory-page">
      <!-- Top Metrics Dashboard -->
      <section class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Total Equipos</span>
            <div class="metric-icon-wrap icon-blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
          </div>
          <div class="metric-value-row">
            <span class="metric-num">{{ stats().totalUnits }}</span>
            <span class="metric-hint">{{ stats().totalItems }} registros activos</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Laptops / Portátiles</span>
            <div class="metric-icon-wrap icon-indigo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="12" rx="2"></rect>
                <line x1="2" y1="20" x2="22" y2="20"></line>
              </svg>
            </div>
          </div>
          <div class="metric-value-row">
            <span class="metric-num">{{ stats().laptops }}</span>
            <span class="metric-hint">Dell Latitude E5440</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Monitores</span>
            <div class="metric-icon-wrap icon-emerald">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
          </div>
          <div class="metric-value-row">
            <span class="metric-num">{{ stats().monitors }}</span>
            <span class="metric-hint">Dell P2210t & P2211ht</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Disponibles</span>
            <div class="metric-icon-wrap icon-amber">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
          <div class="metric-value-row">
            <span class="metric-num">{{ stats().available }}</span>
            <span class="metric-hint">En almacén / listos</span>
          </div>
        </div>
      </section>

      <!-- Main Controls Toolbar -->
      <section class="toolbar-section">
        <div class="toolbar-left">
          <!-- Search Input -->
          <div class="search-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Buscar por equipo, Service Tag (ST), Gorilla, especificaciones..." 
              class="search-input" />
            @if (searchQuery) {
              <button class="clear-search-btn" (click)="searchQuery = ''" aria-label="Limpiar búsqueda">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            }
          </div>

          <!-- Category Filter Pills -->
          <div class="category-pills">
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory() === 'Todos'" 
              (click)="selectedCategory.set('Todos')">
              Todos
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory() === 'Laptop'" 
              (click)="selectedCategory.set('Laptop')">
              Laptops
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory() === 'Monitor'" 
              (click)="selectedCategory.set('Monitor')">
              Monitores
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory() === 'Desktop'" 
              (click)="selectedCategory.set('Desktop')">
              Desktops
            </button>
            <button 
              class="pill-btn" 
              [class.active]="selectedCategory() === 'Accesorio'" 
              (click)="selectedCategory.set('Accesorio')">
              Accesorios
            </button>
          </div>
        </div>

        <div class="toolbar-right">
          <!-- View Switcher (Grid / Table) -->
          <div class="view-toggle-group">
            <button 
              class="btn btn-ghost btn-icon-sm" 
              [class.active-view]="viewMode() === 'grid'" 
              (click)="viewMode.set('grid')" 
              title="Vista en tarjetas">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button 
              class="btn btn-ghost btn-icon-sm" 
              [class.active-view]="viewMode() === 'table'" 
              (click)="viewMode.set('table')" 
              title="Vista en tabla">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Export Button -->
          <button class="btn btn-secondary btn-sm" (click)="exportToCSV()" title="Descargar inventario en CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Exportar CSV</span>
          </button>

          <!-- Add Item Button (Admin Only) -->
          @if (supabase.isAdmin()) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>+ Nuevo Equipo</span>
            </button>
          }
        </div>
      </section>

      <!-- Equipment Inventory Content -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Cargando equipos del inventario...</span>
        </div>
      } @else if (filteredItems().length === 0) {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>No se encontraron equipos</h3>
          <p>Intenta con otro término de búsqueda o cambia el filtro de categoría.</p>
          @if (searchQuery || selectedCategory() !== 'Todos') {
            <button class="btn btn-secondary btn-sm" (click)="searchQuery = ''; selectedCategory.set('Todos')">
              Restablecer Filtros
            </button>
          }
        </div>
      } @else {
        <!-- GRID VIEW -->
        @if (viewMode() === 'grid') {
          <div class="inventory-grid">
            @for (item of filteredItems(); track item.id) {
              <div class="item-card">
                <!-- Card Header -->
                <div class="item-card-top">
                  <div class="category-meta">
                    <span class="category-badge">{{ item.category }}</span>
                    @if (item.quantity > 1) {
                      <span class="quantity-badge">{{ item.quantity }} unidades</span>
                    }
                  </div>
                  <span class="badge" [ngClass]="'status-' + item.status">
                    {{ formatStatus(item.status) }}
                  </span>
                </div>

                <!-- Card Title & Brand -->
                <div class="item-title-section">
                  <h3 class="item-name">{{ item.name }}</h3>
                  <span class="item-model">{{ item.brand }} {{ item.model || '' }}</span>
                </div>

                <!-- Tags Row (Service Tag ST & Gorilla) -->
                <div class="tags-row">
                  @if (item.service_tag) {
                    <div class="tag-pill st-pill" (click)="copyToClipboard(item.service_tag, 'Service Tag')" title="Clic para copiar ST">
                      <span class="tag-label">ST:</span>
                      <span class="tag-val font-mono">{{ item.service_tag }}</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </div>
                  }

                  @if (item.gorilla_tag) {
                    <div class="tag-pill gorilla-pill" (click)="copyToClipboard(item.gorilla_tag, 'Etiqueta Gorilla')" title="Clic para copiar Etiqueta Gorilla">
                      <span class="tag-label">Gorilla:</span>
                      <span class="tag-val font-mono">{{ item.gorilla_tag }}</span>
                    </div>
                  }
                </div>

                <!-- Specifications Box -->
                @if (item.specifications) {
                  <div class="specs-box">
                    <div class="specs-title">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                        <line x1="9" y1="1" x2="9" y2="4"></line>
                        <line x1="15" y1="1" x2="15" y2="4"></line>
                        <line x1="9" y1="20" x2="9" y2="23"></line>
                        <line x1="15" y1="20" x2="15" y2="23"></line>
                        <line x1="20" y1="9" x2="23" y2="9"></line>
                        <line x1="20" y1="14" x2="23" y2="14"></line>
                        <line x1="1" y1="9" x2="4" y2="9"></line>
                        <line x1="1" y1="14" x2="4" y2="14"></line>
                      </svg>
                      <span>Especificaciones</span>
                    </div>
                    <p class="specs-text">{{ item.specifications }}</p>
                  </div>
                }

                <!-- Observations -->
                @if (item.observations) {
                  <div class="obs-box">
                    <span class="obs-label">Obs:</span>
                    <span class="obs-text">{{ item.observations }}</span>
                  </div>
                }

                <!-- Photos Preview Bar -->
                <div class="photos-preview-bar">
                  <div class="photos-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>{{ (item.photos?.length || 0) }} foto(s)</span>
                  </div>

                  @if (item.main_photo_url) {
                    <div class="photo-thumb-mini" (click)="openPhotoManager(item)">
                      <img [src]="item.main_photo_url" alt="Miniatura" />
                    </div>
                  }
                </div>

                <!-- Card Actions -->
                <div class="item-card-actions">
                  <button class="btn btn-secondary btn-sm flex-1" (click)="openPhotoManager(item)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span>{{ (item.photos?.length || 0) > 0 ? 'Ver Fotos (' + item.photos?.length + ')' : (supabase.isAdmin() ? '+ Subir Foto' : 'Ver Fotos') }}</span>
                  </button>

                  @if (supabase.isAdmin()) {
                    <button class="btn btn-secondary btn-icon-sm" (click)="openEditModal(item)" title="Editar equipo">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>
                    <button class="btn btn-danger btn-icon-sm" (click)="confirmDeleteItem(item)" title="Eliminar equipo">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- TABLE VIEW -->
        @if (viewMode() === 'table') {
          <div class="table-container glass-panel">
            <table class="inventory-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Categoría</th>
                  <th>Service Tag (ST)</th>
                  <th>Gorilla Tag</th>
                  <th>Especificaciones</th>
                  <th>Observaciones</th>
                  <th>Cant.</th>
                  <th>Estado</th>
                  <th>Fotos</th>
                  @if (supabase.isAdmin()) {
                    <th class="text-right">Acciones</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (item of filteredItems(); track item.id) {
                  <tr>
                    <td>
                      <div class="table-item-name">
                        <strong>{{ item.name }}</strong>
                        <span class="sub-brand">{{ item.brand }} {{ item.model || '' }}</span>
                      </div>
                    </td>
                    <td><span class="category-badge">{{ item.category }}</span></td>
                    <td>
                      @if (item.service_tag) {
                        <span class="badge badge-st copyable" (click)="copyToClipboard(item.service_tag, 'ST')" title="Copiar ST">
                          {{ item.service_tag }}
                        </span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td>
                      @if (item.gorilla_tag) {
                        <span class="badge badge-gorilla copyable" (click)="copyToClipboard(item.gorilla_tag, 'Gorilla')" title="Copiar Gorilla">
                          {{ item.gorilla_tag }}
                        </span>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td class="cell-specs" [title]="item.specifications || ''">
                      {{ item.specifications || '—' }}
                    </td>
                    <td class="cell-obs" [title]="item.observations || ''">
                      {{ item.observations || '—' }}
                    </td>
                    <td><span class="qty-num">{{ item.quantity }}</span></td>
                    <td>
                      <span class="badge" [ngClass]="'status-' + item.status">
                        {{ formatStatus(item.status) }}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-ghost btn-sm" (click)="openPhotoManager(item)">
                        📷 {{ item.photos?.length || 0 }}
                      </button>
                    </td>
                    @if (supabase.isAdmin()) {
                      <td class="text-right">
                        <div class="table-actions">
                          <button class="btn btn-secondary btn-icon-sm" (click)="openEditModal(item)" title="Editar">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 20h9"></path>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                            </svg>
                          </button>
                          <button class="btn btn-danger btn-icon-sm" (click)="confirmDeleteItem(item)" title="Eliminar">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
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
    .inventory-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.15rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .metric-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .metric-icon-wrap {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-blue { background: rgba(2, 132, 199, 0.12); color: var(--brand-primary); }
    .icon-indigo { background: var(--accent-indigo-bg); color: var(--accent-indigo); }
    .icon-emerald { background: var(--accent-emerald-bg); color: var(--accent-emerald); }
    .icon-amber { background: var(--accent-amber-bg); color: var(--accent-amber); }

    .metric-value-row {
      display: flex;
      align-items: baseline;
      gap: 0.65rem;
    }

    .metric-num {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .metric-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Toolbar */
    .toolbar-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 0.85rem 1.15rem;
      box-shadow: var(--shadow-sm);
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
      min-width: 280px;
    }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 440px;
    }

    .search-icon {
      position: absolute;
      left: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      padding-left: 2.35rem !important;
      padding-right: 2rem !important;
      font-size: 0.825rem;
      border-radius: var(--radius-full) !important;
    }

    .clear-search-btn {
      position: absolute;
      right: 0.65rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0.2rem;
    }

    .category-pills {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      overflow-x: auto;
    }

    .pill-btn {
      padding: 0.35rem 0.75rem;
      font-size: 0.775rem;
      font-weight: 500;
      background: var(--bg-muted);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--duration-fast) var(--ease-out);
    }

    .pill-btn:hover {
      background: var(--bg-surface-hover);
      color: var(--text-primary);
    }

    .pill-btn.active {
      background: var(--brand-primary);
      color: #ffffff;
      border-color: var(--brand-primary);
      box-shadow: 0 2px 8px var(--brand-glow);
    }

    .dark .pill-btn.active {
      color: #090a0f;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .view-toggle-group {
      display: flex;
      background: var(--bg-muted);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.2rem;
      gap: 0.2rem;
    }

    .active-view {
      background: var(--bg-surface) !important;
      color: var(--brand-primary) !important;
      box-shadow: var(--shadow-sm);
    }

    /* Grid Items */
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 1.25rem;
    }

    .item-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      box-shadow: var(--shadow-sm);
      transition: transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), border-color var(--duration-fast) var(--ease-out);
    }

    .item-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: var(--border-hover);
    }

    .item-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .category-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .category-badge {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--brand-primary);
      background: var(--brand-glow);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .quantity-badge {
      font-size: 0.7rem;
      font-weight: 600;
      background: var(--bg-muted);
      color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .item-title-section {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .item-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .item-model {
      font-size: 0.775rem;
      color: var(--text-muted);
    }

    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      cursor: pointer;
      user-select: none;
      transition: filter var(--duration-fast) var(--ease-out);
    }

    .tag-pill:hover {
      filter: brightness(1.15);
    }

    .tag-label {
      font-weight: 600;
      opacity: 0.8;
    }

    .tag-val {
      font-weight: 600;
    }

    .st-pill {
      background: var(--bg-muted);
      border: 1px solid var(--border-subtle);
      color: var(--text-primary);
    }

    .gorilla-pill {
      background: var(--accent-amber-bg);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: var(--accent-amber);
    }

    .specs-box {
      background: var(--bg-muted);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.65rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .specs-title {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .specs-text {
      font-size: 0.825rem;
      color: var(--text-secondary);
      line-height: 1.4;
      font-family: var(--font-mono);
      margin: 0;
    }

    .obs-box {
      font-size: 0.775rem;
      color: var(--text-secondary);
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      padding: 0.45rem 0.65rem;
      background: rgba(0, 0, 0, 0.03);
      border-radius: var(--radius-sm);
    }

    .dark .obs-box {
      background: rgba(255, 255, 255, 0.03);
    }

    .obs-label {
      font-weight: 600;
      color: var(--text-muted);
    }

    .obs-text {
      flex: 1;
    }

    .photos-preview-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.4rem;
      border-top: 1px solid var(--border-subtle);
    }

    .photos-info {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .photo-thumb-mini {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid var(--border-subtle);
      cursor: pointer;
    }

    .photo-thumb-mini img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .item-card-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: auto;
    }

    .flex-1 {
      flex: 1;
    }

    /* Table View Styles */
    .table-container {
      overflow-x: auto;
    }

    .inventory-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.825rem;
    }

    .inventory-table th {
      padding: 0.85rem 1rem;
      font-size: 0.725rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-subtle);
      background-color: var(--bg-surface-elevated);
    }

    .inventory-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      vertical-align: middle;
      color: var(--text-secondary);
    }

    .inventory-table tbody tr:hover {
      background-color: var(--bg-surface-hover);
    }

    .table-item-name {
      display: flex;
      flex-direction: column;
    }

    .table-item-name strong {
      color: var(--text-primary);
      font-size: 0.875rem;
    }

    .sub-brand {
      font-size: 0.725rem;
      color: var(--text-muted);
    }

    .copyable {
      cursor: pointer;
    }

    .copyable:hover {
      filter: brightness(1.15);
    }

    .cell-specs, .cell-obs {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .qty-num {
      font-weight: 700;
      color: var(--text-primary);
    }

    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.35rem;
    }

    .text-right {
      text-align: right;
    }

    .loading-state, .empty-state {
      padding: 4rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      text-align: center;
      color: var(--text-muted);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
    }

    .empty-state h3 {
      font-size: 1.1rem;
      color: var(--text-primary);
    }

    .empty-state p {
      font-size: 0.85rem;
      max-width: 360px;
    }

    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid var(--border-subtle);
      border-top-color: var(--brand-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .toolbar-section {
        flex-direction: column;
        align-items: stretch;
      }
      .toolbar-left, .toolbar-right {
        width: 100%;
        justify-content: space-between;
      }
      .search-wrap {
        max-width: none;
      }
    }
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

    if (!confirm(`¿Estás seguro de eliminar "${item.name}" con ST: ${item.service_tag || 'N/A'}?`)) {
      return;
    }

    const { error } = await this.supabase.deleteItem(item.id);
    if (error) {
      this.toast.error('Error al eliminar', error.message);
    } else {
      this.toast.info('Equipo eliminado', `"${item.name}" se removió del inventario.`);
      this.loadInventory();
    }
  }

  copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success('Copiado', `${label}: ${text}`);
    }).catch(() => {
      this.toast.info('Copiado', text);
    });
  }

  formatStatus(status: ItemStatus): string {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'en_uso': return 'En Uso';
      case 'mantenimiento': return 'Mantenimiento';
      case 'baja': return 'Baja';
      default: return status;
    }
  }

  exportToCSV(): void {
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
    link.setAttribute('download', `inventario-id-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toast.success('Descarga iniciada', 'Se ha exportado el inventario en formato CSV.');
  }
}
