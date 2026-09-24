import { Component, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { InventoryListComponent } from './components/inventory-list/inventory-list.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { UserManagerModalComponent } from './components/user-manager-modal/user-manager-modal.component';
import { LoginViewComponent } from './components/login-view/login-view.component';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    SidebarComponent,
    InventoryListComponent,
    ToastContainerComponent,
    AuthModalComponent,
    UserManagerModalComponent,
    LoginViewComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly supabase = inject(SupabaseService);

  readonly title = signal('Inventario-ID');
  readonly sidebarOpen = signal<boolean>(false);
  readonly showAuthModal = signal<boolean>(false);
  readonly showUserManagerModal = signal<boolean>(false);

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.getElementById('equipmentSearch') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }
  }

  onTabSelected(tab: string): void {
    // If future routing is added, handle it here
    console.log('Tab selected:', tab);
  }
}
