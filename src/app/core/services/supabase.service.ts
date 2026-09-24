import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { InventoryItem, ItemPhoto, UserProfile, UserRole } from '../models/inventory.model';

const STORAGE_KEY_URL = 'inventario_supabase_url';
const STORAGE_KEY_ANON = 'inventario_supabase_anon_key';
const STORAGE_KEY_ITEMS = 'inventario_local_items_v1';
const STORAGE_KEY_DEMO_ROLE = 'inventario_demo_role';

// Datos iniciales solicitados por el usuario
export const INITIAL_SEED_ITEMS: InventoryItem[] = [
  {
    id: 'seed-item-1',
    name: 'Dell Latitude E5440',
    category: 'Laptop',
    brand: 'Dell',
    model: 'Latitude E5440',
    service_tag: '1T0KP12',
    gorilla_tag: '1904',
    specifications: 'i5 4ta 8gb 120 HDD',
    observations: 'Cuenta con cargador',
    quantity: 1,
    status: 'disponible',
    location: 'Sistemas / Almacén',
    assigned_to: null,
    main_photo_url: null,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
    photos: []
  },
  {
    id: 'seed-item-2',
    name: 'Dell Latitude E5440',
    category: 'Laptop',
    brand: 'Dell',
    model: 'Latitude E5440',
    service_tag: '7CJZN32',
    gorilla_tag: '2376',
    specifications: 'i5 4ta 8gb 128 HDD',
    observations: 'Cuenta con cargador. Requiere/tiene foto.',
    quantity: 1,
    status: 'disponible',
    location: 'Sistemas / Almacén',
    assigned_to: null,
    main_photo_url: null,
    created_at: new Date('2026-01-12T11:30:00Z').toISOString(),
    photos: []
  },
  {
    id: 'seed-item-3',
    name: 'Monitores Dell P2210t',
    category: 'Monitor',
    brand: 'Dell',
    model: 'P2210t',
    service_tag: null,
    gorilla_tag: null,
    specifications: 'Monitor Profesional 22" (DVI, VGA, DisplayPort, Hub USB)',
    observations: '11 en total contando este',
    quantity: 11,
    status: 'disponible',
    location: 'Almacén de Periféricos',
    assigned_to: null,
    main_photo_url: null,
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    photos: []
  },
  {
    id: 'seed-item-4',
    name: 'Monitores Dell P2211ht',
    category: 'Monitor',
    brand: 'Dell',
    model: 'P2211ht',
    service_tag: null,
    gorilla_tag: null,
    specifications: 'Monitor LED Full HD 21.5" (DVI-D, VGA, Hub USB)',
    observations: '2 en total',
    quantity: 2,
    status: 'disponible',
    location: 'Almacén de Periféricos',
    assigned_to: null,
    main_photo_url: null,
    created_at: new Date('2026-01-18T14:15:00Z').toISOString(),
    photos: []
  }
];

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient | null = null;

  readonly isConfigured = signal<boolean>(false);
  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<UserProfile | null>(null);
  readonly demoMode = signal<boolean>(false);
  readonly demoRole = signal<UserRole>('admin'); // 'admin' por defecto en demo para probar todas las funciones
  readonly loading = signal<boolean>(false);

  // Computado de si el usuario actual tiene permisos de Administrador
  readonly isAdmin = computed(() => {
    if (this.demoMode() || !this.isConfigured()) {
      return this.demoRole() === 'admin';
    }
    return this.currentProfile()?.role === 'admin';
  });

  // Rol actual formateado
  readonly activeRole = computed<UserRole>(() => {
    if (this.demoMode() || !this.isConfigured()) {
      return this.demoRole();
    }
    return this.currentProfile()?.role ?? 'normal';
  });

  constructor() {
    this.initClient();
  }

  /**
   * Inicializa la conexión con Supabase leyendo de environment o localStorage
   */
  initClient(): void {
    const url = localStorage.getItem(STORAGE_KEY_URL) || environment.supabaseUrl;
    const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || environment.supabaseAnonKey;
    const savedDemoRole = localStorage.getItem(STORAGE_KEY_DEMO_ROLE) as UserRole | null;
    if (savedDemoRole) {
      this.demoRole.set(savedDemoRole);
    }

    if (url && anonKey && url.startsWith('http')) {
      try {
        this.client = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        this.isConfigured.set(true);
        this.demoMode.set(false);

        // Escuchar cambios de sesión
        this.client.auth.onAuthStateChange(async (event, session) => {
          this.currentUser.set(session?.user ?? null);
          if (session?.user) {
            await this.fetchProfile(session.user.id, session.user.email ?? '');
          } else {
            this.currentProfile.set(null);
          }
        });

        // Verificar sesión actual existente
        this.checkInitialSession();
      } catch (err) {
        console.error('Error inicializando cliente Supabase:', err);
        this.isConfigured.set(false);
        this.demoMode.set(true);
      }
    } else {
      this.isConfigured.set(false);
      this.demoMode.set(true);
    }
  }

  private async checkInitialSession(): Promise<void> {
    if (!this.client) return;
    try {
      const { data: { session } } = await this.client.auth.getSession();
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        await this.fetchProfile(session.user.id, session.user.email ?? '');
      }
    } catch (e) {
      console.warn('No se pudo restaurar la sesión de Supabase:', e);
    }
  }

  private async fetchProfile(userId: string, email: string): Promise<void> {
    if (!this.client) return;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error obteniendo perfil, usando perfil básico:', error);
        this.currentProfile.set({
          id: userId,
          email,
          role: 'normal'
        });
        return;
      }

      if (data) {
        this.currentProfile.set(data as UserProfile);
      } else {
        // En caso de que el trigger aún no haya corrido
        this.currentProfile.set({
          id: userId,
          email,
          role: 'normal'
        });
      }
    } catch (err) {
      console.error('Excepción al buscar perfil:', err);
    }
  }

  /**
   * Guarda credenciales de Supabase en localStorage para conexión inmediata
   */
  configureCredentials(url: string, anonKey: string): boolean {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl.startsWith('http') || !trimmedKey) {
      return false;
    }

    localStorage.setItem(STORAGE_KEY_URL, trimmedUrl);
    localStorage.setItem(STORAGE_KEY_ANON, trimmedKey);
    this.initClient();
    return true;
  }

  clearCredentials(): void {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
    this.client = null;
    this.isConfigured.set(false);
    this.currentUser.set(null);
    this.currentProfile.set(null);
    this.demoMode.set(true);
  }

  setDemoRole(role: UserRole): void {
    this.demoRole.set(role);
    localStorage.setItem(STORAGE_KEY_DEMO_ROLE, role);
  }

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase no está configurado aún.') };
    }
    this.loading.set(true);
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        this.currentUser.set(data.user);
        await this.fetchProfile(data.user.id, data.user.email ?? email);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async signUp(email: string, password: string, fullName?: string): Promise<{ error: Error | null; isFirstUser?: boolean }> {
    if (!this.client) {
      return { error: new Error('Supabase no está configurado aún.') };
    }
    this.loading.set(true);
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || splitEmail(email)
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        this.currentUser.set(data.user);
        await this.fetchProfile(data.user.id, data.user.email ?? email);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (this.client) {
      await this.client.auth.signOut();
    }
    this.currentUser.set(null);
    this.currentProfile.set(null);
  }

  // ==========================================
  // GESTIÓN DEL INVENTARIO (CRUD)
  // ==========================================

  async getInventory(): Promise<InventoryItem[]> {
    if (!this.client || this.demoMode()) {
      return this.getLocalItems();
    }

    try {
      const { data, error } = await this.client
        .from('inventory_items')
        .select(`
          *,
          photos:inventory_item_photos(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error consultando Supabase, usando almacenamiento local:', error);
        return this.getLocalItems();
      }

      if (!data || data.length === 0) {
        // Si la tabla está vacía en Supabase, podemos sembrar los iniciales
        return this.getLocalItems();
      }

      return data as InventoryItem[];
    } catch (e) {
      console.warn('Excepción al consultar inventario:', e);
      return this.getLocalItems();
    }
  }

  async createItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'photos'>): Promise<{ item: InventoryItem | null; error: Error | null }> {
    if (!this.isAdmin()) {
      return { item: null, error: new Error('Permiso denegado: solo administradores pueden agregar equipos.') };
    }

    if (!this.client || this.demoMode()) {
      const newItem: InventoryItem = {
        ...item,
        id: 'local-' + Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        photos: []
      };
      const items = this.getLocalItems();
      items.unshift(newItem);
      this.saveLocalItems(items);
      return { item: newItem, error: null };
    }

    try {
      const { data, error } = await this.client
        .from('inventory_items')
        .insert({
          ...item,
          created_by: this.currentUser()?.id
        })
        .select()
        .single();

      if (error) throw error;
      return { item: { ...(data as InventoryItem), photos: [] }, error: null };
    } catch (err: any) {
      return { item: null, error: err };
    }
  }

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<{ error: Error | null }> {
    if (!this.isAdmin()) {
      return { error: new Error('Permiso denegado: solo administradores pueden modificar equipos.') };
    }

    if (!this.client || this.demoMode()) {
      const items = this.getLocalItems();
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) {
        items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
        this.saveLocalItems(items);
      }
      return { error: null };
    }

    try {
      const { error } = await this.client
        .from('inventory_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async deleteItem(id: string): Promise<{ error: Error | null }> {
    if (!this.isAdmin()) {
      return { error: new Error('Permiso denegado: solo administradores pueden eliminar equipos.') };
    }

    if (!this.client || this.demoMode()) {
      const items = this.getLocalItems().filter(i => i.id !== id);
      this.saveLocalItems(items);
      return { error: null };
    }

    try {
      const { error } = await this.client
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  // ==========================================
  // GESTIÓN DE FOTOS (<10MB) Y STORAGE
  // ==========================================

  async uploadPhoto(itemId: string, file: File): Promise<{ photo: ItemPhoto | null; error: Error | null }> {
    if (!this.isAdmin()) {
      return { photo: null, error: new Error('Permiso denegado: solo administradores pueden subir fotos.') };
    }

    // Validación estricta de 10 MB
    const MAX_SIZE = environment.maxPhotoSizeBytes; // 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return {
        photo: null,
        error: new Error(`El archivo excede el tamaño máximo de 10 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`)
      };
    }

    // Validación de tipo de archivo
    if (!file.type.startsWith('image/')) {
      return {
        photo: null,
        error: new Error('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP, etc.).')
      };
    }

    // Modo Demo / Local
    if (!this.client || this.demoMode()) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Url = reader.result as string;
          const newPhoto: ItemPhoto = {
            id: 'photo-' + Date.now(),
            item_id: itemId,
            storage_path: `local/${itemId}/${file.name}`,
            public_url: base64Url,
            file_name: file.name,
            file_size: file.size,
            created_at: new Date().toISOString()
          };

          // Actualizar en memoria local
          const items = this.getLocalItems();
          const target = items.find(i => i.id === itemId);
          if (target) {
            target.photos = target.photos || [];
            target.photos.push(newPhoto);
            if (!target.main_photo_url) {
              target.main_photo_url = base64Url;
            }
            this.saveLocalItems(items);
          }

          resolve({ photo: newPhoto, error: null });
        };
        reader.onerror = () => {
          resolve({ photo: null, error: new Error('Error al procesar la imagen local.') });
        };
        reader.readAsDataURL(file);
      });
    }

    // Modo Supabase conectado
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `items/${itemId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await this.client.storage
        .from(environment.storageBucket)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = this.client.storage
        .from(environment.storageBucket)
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      // Registrar foto en la base de datos
      const { data: photoData, error: dbError } = await this.client
        .from('inventory_item_photos')
        .insert({
          item_id: itemId,
          storage_path: storagePath,
          public_url: publicUrl,
          file_name: file.name,
          file_size: file.size
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Actualizar foto principal del ítem
      await this.client
        .from('inventory_items')
        .update({ main_photo_url: publicUrl })
        .eq('id', itemId)
        .is('main_photo_url', null);

      return { photo: photoData as ItemPhoto, error: null };
    } catch (err: any) {
      console.error('Error al subir foto:', err);
      return { photo: null, error: err };
    }
  }

  async deletePhoto(photo: ItemPhoto, itemId: string): Promise<{ error: Error | null }> {
    if (!this.isAdmin()) {
      return { error: new Error('Permiso denegado: solo administradores pueden eliminar fotos.') };
    }

    if (!this.client || this.demoMode()) {
      const items = this.getLocalItems();
      const target = items.find(i => i.id === itemId);
      if (target && target.photos) {
        target.photos = target.photos.filter(p => p.id !== photo.id);
        if (target.main_photo_url === photo.public_url) {
          target.main_photo_url = target.photos.length > 0 ? target.photos[0].public_url : null;
        }
        this.saveLocalItems(items);
      }
      return { error: null };
    }

    try {
      // Borrar de storage
      await this.client.storage
        .from(environment.storageBucket)
        .remove([photo.storage_path]);

      // Borrar registro de BD
      const { error } = await this.client
        .from('inventory_item_photos')
        .delete()
        .eq('id', photo.id);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  // ==========================================
  // ALMACENAMIENTO LOCAL / MOCK FALLBACK
  // ==========================================

  private getLocalItems(): InventoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      this.saveLocalItems(INITIAL_SEED_ITEMS);
      return [...INITIAL_SEED_ITEMS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [...INITIAL_SEED_ITEMS];
    }
  }

  private saveLocalItems(items: InventoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  resetLocalSeed(): void {
    this.saveLocalItems(INITIAL_SEED_ITEMS);
  }
}

function splitEmail(email: string): string {
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
