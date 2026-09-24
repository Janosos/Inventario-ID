import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { InventoryItem, ItemPhoto, UserProfile, UserRole } from '../models/inventory.model';

const STORAGE_KEY_ITEMS = 'inventario_local_items_v1';

export const SEED_UUID_MAP: Record<string, string> = {
  'seed-item-1': 'e5440001-0000-4000-8000-000000000001',
  'seed-item-2': 'e5440002-0000-4000-8000-000000000002',
  'seed-item-3': 'd2210003-0000-4000-8000-000000000003',
  'seed-item-4': 'd2211004-0000-4000-8000-000000000004'
};

export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function ensureValidUUID(id: string): string {
  if (isValidUUID(id)) return id;
  if (SEED_UUID_MAP[id]) return SEED_UUID_MAP[id];
  return generateUUID();
}

// Datos iniciales con identificadores UUID válidos para compatibilidad con PostgreSQL/Supabase
export const INITIAL_SEED_ITEMS: InventoryItem[] = [
  {
    id: 'e5440001-0000-4000-8000-000000000001',
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
    id: 'e5440002-0000-4000-8000-000000000002',
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
    id: 'd2210003-0000-4000-8000-000000000003',
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
    id: 'd2211004-0000-4000-8000-000000000004',
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

  readonly isConfigured = signal<boolean>(true);
  readonly currentUser = signal<User | null>(null);
  readonly currentProfile = signal<UserProfile | null>(null);
  readonly loading = signal<boolean>(false);

  // Computado de si el usuario actual tiene rol de Administrador
  readonly isAdmin = computed(() => {
    return this.currentProfile()?.role === 'admin';
  });

  // Rol actual formateado
  readonly activeRole = computed<UserRole>(() => {
    return this.currentProfile()?.role ?? 'normal';
  });

  constructor() {
    this.initClient();
  }

  /**
   * Inicializa la conexión directa permanente con Supabase usando las credenciales del environment
   */
  initClient(): void {
    const url = environment.supabaseUrl || 'https://xcprikwhtdzwzlpbpqzk.supabase.co';
    const anonKey = environment.supabaseAnonKey || 'sb_publishable_9dumeRI4l3X_FZSwhitjXg_NyU27iyd';

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
      }
    }
  }

  private getRedirectUrl(): string {
    return window.location.origin + window.location.pathname;
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
        console.warn('Error obteniendo perfil, usando perfil normal por defecto:', error);
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

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase no está configurado.') };
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

  async signUp(email: string, password: string, fullName?: string): Promise<{ error: Error | null }> {
    if (!this.client) {
      return { error: new Error('Supabase no está configurado.') };
    }
    this.loading.set(true);
    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || splitEmail(email)
          },
          emailRedirectTo: this.getRedirectUrl()
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
  // GESTIÓN DE USUARIOS POR EL ADMINISTRADOR
  // ==========================================

  /**
   * Permite al Administrador registrar nuevos usuarios (rol Admin o Normal)
   * Usa un cliente secundario efímero con persistSession: false para NO interrumpir la sesión del Administrador
   */
  async adminCreateUser(
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ error: Error | null; user?: any }> {
    if (!this.isAdmin()) {
      return { error: new Error('Permiso denegado: solo administradores pueden registrar usuarios.') };
    }

    try {
      const url = environment.supabaseUrl || 'https://xcprikwhtdzwzlpbpqzk.supabase.co';
      const anonKey = environment.supabaseAnonKey || 'sb_publishable_9dumeRI4l3X_FZSwhitjXg_NyU27iyd';
      const tempClient = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data, error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role
          },
          emailRedirectTo: this.getRedirectUrl()
        }
      });

      if (error) throw error;

      // Asegurar el rol en la tabla public.profiles mediante la sesión del administrador
      if (data.user && this.client) {
        await this.client.from('profiles').update({
          role: role,
          full_name: fullName
        }).eq('id', data.user.id);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err };
    }
  }

  /**
   * Obtiene la lista de todos los perfiles de usuario registrados
   */
  async getProfiles(): Promise<{ profiles: UserProfile[]; error: Error | null }> {
    if (!this.client) return { profiles: [], error: null };
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { profiles: (data as UserProfile[]) || [], error: null };
    } catch (err: any) {
      return { profiles: [], error: err };
    }
  }

  /**
   * Permite al Administrador cambiar el rol de cualquier usuario
   */
  async updateProfileRole(userId: string, newRole: UserRole): Promise<{ error: Error | null }> {
    if (!this.isAdmin()) {
      return { error: new Error('Solo los administradores pueden cambiar roles de usuario.') };
    }
    if (!this.client) return { error: null };
    try {
      const { error } = await this.client
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  // ==========================================
  // GESTIÓN DEL INVENTARIO (CRUD)
  // ==========================================

  ensureValidUUID(id: string): string {
    return ensureValidUUID(id);
  }

  generateUUID(): string {
    return generateUUID();
  }

  async getInventory(): Promise<InventoryItem[]> {
    if (!this.client) {
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
        console.warn('Error consultando Supabase, usando respaldo local:', error);
        return this.getLocalItems();
      }

      if (!data || data.length === 0) {
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

    if (!this.client) {
      const newItem: InventoryItem = {
        ...item,
        id: generateUUID(),
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

    const validId = ensureValidUUID(id);

    // 1. Siempre actualizar en respaldo local
    const items = this.getLocalItems();
    const idx = items.findIndex(i => i.id === id || i.id === validId);
    let fullItem: InventoryItem | null = null;
    if (idx !== -1) {
      items[idx] = { 
        ...items[idx], 
        ...updates, 
        id: validId, 
        updated_at: new Date().toISOString() 
      };
      fullItem = items[idx];
      this.saveLocalItems(items);
    }

    if (!this.client) {
      return { error: null };
    }

    try {
      // 2. Limpiar carga útil para evitar conflictos con columnas relacionales o protegidas
      const cleanPayload: any = { ...updates };
      delete cleanPayload.id;
      delete cleanPayload.photos;
      delete cleanPayload.created_at;
      cleanPayload.updated_at = new Date().toISOString();

      const { data, error } = await this.client
        .from('inventory_items')
        .update(cleanPayload)
        .eq('id', validId)
        .select();

      if (error) {
        console.error('Error al actualizar en Supabase:', error);
        throw error;
      }

      // Si no afectó ninguna fila (por ejemplo, el ítem fue generado localmente y no existe aún en Supabase)
      if (!data || data.length === 0) {
        const itemToInsert = fullItem || (updates as any);
        const insertPayload: any = {
          id: validId,
          name: itemToInsert.name || 'Equipo',
          category: itemToInsert.category || 'Laptop',
          brand: itemToInsert.brand || 'Dell',
          model: itemToInsert.model || null,
          service_tag: itemToInsert.service_tag || null,
          gorilla_tag: itemToInsert.gorilla_tag || null,
          specifications: itemToInsert.specifications || null,
          observations: itemToInsert.observations || null,
          quantity: itemToInsert.quantity ?? 1,
          status: itemToInsert.status || 'disponible',
          location: itemToInsert.location || 'Sistemas / Almacén',
          assigned_to: itemToInsert.assigned_to || null,
          main_photo_url: itemToInsert.main_photo_url || null,
          created_by: this.currentUser()?.id || null,
          updated_at: new Date().toISOString()
        };

        const { error: insertErr } = await this.client
          .from('inventory_items')
          .insert(insertPayload);

        if (insertErr) {
          console.warn('Advertencia al insertar ítem de respaldo en Supabase:', insertErr);
        }
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  }

  async deleteItem(id: string): Promise<{ error: Error | null }> {
    if (!this.isAdmin()) {
      return { error: new Error('Permiso denegado: solo administradores pueden eliminar equipos.') };
    }

    const validId = ensureValidUUID(id);

    const items = this.getLocalItems().filter(i => i.id !== id && i.id !== validId);
    this.saveLocalItems(items);

    if (!this.client) {
      return { error: null };
    }

    try {
      const { error } = await this.client
        .from('inventory_items')
        .delete()
        .eq('id', validId);

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

    const validId = ensureValidUUID(itemId);

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

    if (!this.client) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Url = reader.result as string;
          const newPhoto: ItemPhoto = {
            id: generateUUID(),
            item_id: validId,
            storage_path: `local/${validId}/${file.name}`,
            public_url: base64Url,
            file_name: file.name,
            file_size: file.size,
            created_at: new Date().toISOString()
          };

          const items = this.getLocalItems();
          const target = items.find(i => i.id === itemId || i.id === validId);
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

    // Subida a Supabase Storage
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `items/${validId}/${Date.now()}_${sanitizedName}`;

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

      // Registrar foto en la tabla
      const { data: photoData, error: dbError } = await this.client
        .from('inventory_item_photos')
        .insert({
          item_id: validId,
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
        .eq('id', validId)
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

    if (!this.client) {
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
      await this.client.storage
        .from(environment.storageBucket)
        .remove([photo.storage_path]);

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

  private getLocalItems(): InventoryItem[] {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (!raw) {
      this.saveLocalItems(INITIAL_SEED_ITEMS);
      return [...INITIAL_SEED_ITEMS];
    }
    try {
      const items: InventoryItem[] = JSON.parse(raw);
      let modified = false;
      const sanitized = items.map(item => {
        const validId = ensureValidUUID(item.id);
        if (validId !== item.id) {
          modified = true;
          return {
            ...item,
            id: validId,
            photos: (item.photos || []).map(p => ({
              ...p,
              id: ensureValidUUID(p.id),
              item_id: validId
            }))
          };
        }
        return item;
      });
      if (modified) {
        this.saveLocalItems(sanitized);
      }
      return sanitized;
    } catch {
      this.saveLocalItems(INITIAL_SEED_ITEMS);
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
}

function splitEmail(email: string): string {
  const name = email.split('@')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
