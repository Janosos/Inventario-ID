# 💻 Inventario-ID | Control de Equipo de Cómputo

Aplicación web moderna y reactiva construida en **Angular 19+**, integrada con **Supabase** (Auth, Postgres RLS y Storage para fotos <10MB), diseñada bajo los principios de artesanía de diseño de **[Emil Kowalski](https://github.com/emilkowalski/skills)** y la fluidez de interacción de **Apple Design**.

Diseñada para ser alojada de forma estática en **GitHub Pages**.

---

## ✨ Características Principales

- 🛡️ **Control de Roles (Admin / Normal)**:
  - **Administrador**: Poder absoluto para crear, editar, eliminar equipos, gestionar fotografías y controlar el inventario.
  - **Usuario Normal**: Acceso de consulta, búsqueda avanzada por Service Tag (ST) y etiquetas, filtrado por categorías y visualización de fotos.
  - **Selector de Rol en Vivo**: Permite probar la experiencia de ambos roles con un solo clic.
- 📸 **Gestión de Fotografías con Límite de 10 MB**:
  - Drag & Drop intuitivo y selector de archivos.
  - Validación estricta tanto en cliente como en base de datos de tamaño máximo de **10 MB** (`10,485,760 bytes`).
  - Almacenamiento optimizado en el bucket `inventory-photos` de Supabase Storage.
  - Galería interactiva y visor Lightbox a pantalla completa.
- 🎨 **Diseño Artesanal (Craft UI) inspirado en Emil Kowalski**:
  - Curvas de aceleración personalizadas: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
  - Micro-interacciones táctiles en botones con retroalimentación instantánea (`transform: scale(0.97)` en `:active`).
  - Transiciones UI fluidas y deliberadas por debajo de 300 ms.
  - Modales con origen espacial real (sin transiciones desde `scale(0)`).
  - Notificaciones elegantes estilo **Sonner** con apilamiento y animación de entrada/salida.
  - Modo Oscuro / Claro profundo con persistencia y efecto de vidrio (*Glassmorphism*).
- 🏷️ **Campos Especializados para Equipo de Cómputo**:
  - **Service Tag (ST)** con botón de copiado rápido al portapapeles en un toque.
  - **Etiqueta Gorilla** para control interno de inventario.
  - **Especificaciones Técnicas** (Procesador, RAM, Disco, Pantalla).
  - **Observaciones y Accesorios** (Cargadores, cables, detalles estéticos).
  - **Cantidad en Lote** (ideal para partidas como monitores o periféricos).
- 📊 **Métricas en Tiempo Real & Exportación**:
  - Contadores automáticos de unidades totales, laptops, monitores y estado de disponibilidad.
  - Exportación con un clic a **CSV**.

---

## 📦 Equipos Registrados Inicialmente (Datos Semilla)

1. **Dell Latitude E5440**
   - **Service Tag (ST)**: `1T0KP12`
   - **Etiqueta Gorilla**: `1904`
   - **Especificaciones**: `i5 4ta 8gb 120 HDD`
   - **Observaciones**: Cuenta con cargador
   - **Cantidad**: 1

2. **Dell Latitude E5440**
   - **Service Tag (ST)**: `7CJZN32`
   - **Etiqueta Gorilla**: `2376`
   - **Especificaciones**: `i5 4ta 8gb 128 HDD`
   - **Observaciones**: Cuenta con cargador. Requiere/tiene foto.
   - **Cantidad**: 1

3. **Monitores Dell P2210t**
   - **Especificaciones**: Monitor Profesional 22" (DVI, VGA, DisplayPort)
   - **Observaciones**: 11 en total contando este
   - **Cantidad**: 11 unidades

4. **Monitores Dell P2211ht**
   - **Especificaciones**: Monitor LED Full HD 21.5" (DVI-D, VGA)
   - **Observaciones**: 2 en total
   - **Cantidad**: 2 unidades

---

## 🚀 Configuración de Supabase

El script SQL completo se encuentra en [`supabase/schema.sql`](supabase/schema.sql).

### Pasos:
1. Abre tu proyecto **Inventario-ID** en [Supabase Dashboard](https://supabase.com/dashboard).
2. Dirígete a **SQL Editor** y presiona **New Query**.
3. Copia y pega el contenido de `supabase/schema.sql` y ejecútalo (**Run**).
4. El script configurará automáticamente:
   - Tabla de perfiles `public.profiles` y función de verificación `is_admin()`.
   - Asignación de rol `admin` al primer usuario registrado.
   - Tabla `public.inventory_items` e `inventory_item_photos`.
   - Bucket público `inventory-photos` con límite estricto de **10 MB** por archivo.
   - Políticas RLS (Row Level Security) para proteger inserciones, modificaciones y borrados.
   - Los datos semilla iniciales de los equipos listados arriba.
5. Obtén tu **Project URL** y **Anon Key** desde **Project Settings -> API** y colócalas en la interfaz web (botón *Configurar Supabase*) o en `src/environments/environment.ts`.

---

## 🛠️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

Abre [http://localhost:4200](http://localhost:4200) en tu navegador.

---

## 🌐 Despliegue en GitHub Pages

La aplicación está lista para desplegarse mediante GitHub Actions:
- La ruta del enrutador usa `withHashLocation()` para evitar errores 404 en recargas de GitHub Pages.
- El archivo `.github/workflows/deploy.yml` compilará y publicará automáticamente tu proyecto cada vez que hagas `git push` a `main`.

Para compilar manualmente:
```bash
npm run build:gh
```
El resultado se generará en `dist/inventario-app/browser`.
