export type UserRole = 'admin' | 'normal';

export type ItemCategory = 'Laptop' | 'Monitor' | 'Desktop' | 'Accesorio' | 'Servidor' | 'Otro';

export type ItemStatus = 'disponible' | 'en_uso' | 'mantenimiento' | 'baja' | 'para_piezas';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ItemPhoto {
  id: string;
  item_id: string;
  storage_path: string;
  public_url: string;
  file_name: string;
  file_size: number;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  brand: string;
  model?: string | null;
  service_tag?: string | null;     // ST (ej. 1T0KP12, 7CJZN32)
  gorilla_tag?: string | null;     // Etiqueta Gorilla (ej. 1904, 2376)
  specifications?: string | null;  // Ej. i5 4ta 8gb 120 HDD
  observations?: string | null;    // Ej. Cuenta con cargador
  quantity: number;                // Cantidad total (ej. 11 monitores Dell P2210t)
  status: ItemStatus;
  location?: string | null;
  assigned_to?: string | null;
  main_photo_url?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  photos?: ItemPhoto[];
}

export interface InventoryStats {
  totalItems: number;
  totalUnits: number;
  laptops: number;
  monitors: number;
  desktops: number;
  accessories: number;
  available: number;
  inUse: number;
  maintenance: number;
}
