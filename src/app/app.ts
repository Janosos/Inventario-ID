import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { UserManagerModalComponent } from './components/user-manager-modal/user-manager-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    InventoryListComponent,
    ToastContainerComponent,
    AuthModalComponent,
    UserManagerModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly title = signal('Inventario-ID');
  readonly showAuthModal = signal<boolean>(false);
  readonly showUserManagerModal = signal<boolean>(false);
}
