// Plantilla de configuración de entorno para Inventario-ID
// Copia este archivo a `environment.ts` y `environment.prod.ts` e ingresa tus credenciales reales de Supabase:

export const environment = {
  production: false,
  supabaseUrl: 'https://TU-PROYECTO.supabase.co',
  supabaseAnonKey: 'TU-SUPABASE-ANON-KEY-AQUI',
  storageBucket: 'inventory-photos',
  maxPhotoSizeBytes: 10 * 1024 * 1024, // 10 MB máximo
};
