import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { ConfigModalComponent } from './components/config-modal/config-modal.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    InventoryListComponent,
    ToastContainerComponent,
    ConfigModalComponent,
    AuthModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly title = signal('Inventario-ID');
  readonly showConfigModal = signal<boolean>(false);
  readonly showAuthModal = signal<boolean>(false);
}
