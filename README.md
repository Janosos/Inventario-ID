# 💻 Inventario-ID | Control & Gestión IT Empresarial

Sistema web integral, moderno y reactivo para el control, auditoría y seguimiento de activos tecnológicos empresariales (Laptops, Monitores, Desktops, Accesorios y Servidores). 

Desarrollado en **Angular** con arquitectura de componentes autónomos (*Standalone Components*), **Signals** reactivos, backend sin servidor en **Supabase** (PostgreSQL con Row Level Security, Auth y Storage), y exportación ejecutiva a **Microsoft Excel (.xlsx)** con fotografías incrustadas.

---

## 👤 Autor & Desarrollador

- **Autor:** **Janosos (Ezequiel López)**
- **GitHub:** [@Janosos](https://github.com/Janosos)
- **Contacto:** `ezequiel_lopez@unikino.edu.mx`
- **Repositorio:** [https://github.com/Janosos/Inventario-ID](https://github.com/Janosos/Inventario-ID)

---

## ✨ Características Principales

### 🔐 1. Autenticación y Control de Acceso TI
- **Pantalla de Inicio de Sesión Obligatoria:** Ningún usuario puede ver el inventario ni la información del sistema sin antes autenticarse con correo y contraseña.
- **Acceso Unificado a Datos:** Tanto los usuarios con rol **Normal** como los **Administradores** visualizan en tiempo real el inventario completo sincronizado desde Supabase.
- **Persistencia Segura de Sesión:** Detección y restauración automática de sesiones previas sin parpadeos visuales (*Splash Screen* de verificación).
- **Protección de Trabajo:** Las reglas de base de datos aseguran que los activos y fotos se mantengan persistentes de manera global.

### 🛡️ 2. Jerarquía de Roles
- **Administrador:**
  - Registro, edición y eliminación de equipos.
  - Subida, gestión y eliminación de fotografías de alta definición (<10 MB).
  - Gestión completa de usuarios: invitar nuevos miembros, alternar roles entre Admin y Normal, y **eliminar permanentemente cuentas de usuario** del sistema con confirmación de seguridad y protección contra auto-eliminación.
  - Generación y exportación de reportes ejecutivos en Excel (.xlsx).
- **Usuario Normal:**
  - Modo consulta seguro y optimizado.
  - Búsqueda en vivo por Service Tag (ST), Gorilla Tag, marca, modelo y especificaciones.
  - Filtrado interactivo por categorías.
  - Visualización de especificaciones detalladas y fotografías en alta resolución.
  - Restricción estricta de modificación, eliminación o exportación de datos.

### 📊 3. Exportación Ejecutiva en Excel (.xlsx) con Fotografías
- **Hojas de Cálculo Nativas (.xlsx):** Generación cliente mediante `exceljs` sin advertencias de formato.
- **Fotografías Incrustadas en Cada Celda:** Cada equipo con foto incluye su miniatura optimizada directamente en la columna `FOTO`, con altura de fila ajustada (54 pt).
- **Enlace Interactivo HD:** Columna con enlace directo (`Ver Foto HD`) para abrir la imagen original en alta resolución en el navegador.
- **Diseño Corporativo:**
  - Banner ejecutivo azul marino (`#0F2A4A`) con metadatos de emisión (fecha, hora, nombre del administrador emisor y total de activos).
  - Cabeceras estilizadas con bordes de contraste y **filtros automáticos desplegables**.
  - Filas alternadas estilo cebra (`#FFFFFF` / `#F8FAFC`).
  - **Insignias de Estado con código de color:** Disponible (verde), En uso (azul), Para piezas (ámbar/dorado), Baja (rojo vino) y Mantenimiento (naranja).
  - Inmovilización de paneles para mantener visible la cabecera durante el scroll.

### 💻 4. Control Integral de Equipos
- **Service Tag (ST):** Identificador de fabricante con botón de copiado rápido al portapapeles.
- **Gorilla Tag:** Código de control interno de inventario.
- **Especificaciones Técnicas:** Procesador, memoria RAM, almacenamiento y pantalla.
- **Observaciones & Periféricos:** Control de cargadores, cables, accesorios y detalles de condición.
- **Estados Operativos:** `Disponible`, `En uso`, `Para piezas`, `Mantenimiento` y `Baja`.
- **Cantidades por Lote:** Soporte para partidas múltiples (ej. monitores en stock).

### 📱 5. Diseño Artesanal y Adaptabilidad Móvil
- **Diseño UI/UX de Alta Gama:** Inspirado en las directrices de Emil Kowalski y Apple Human Interface, con modo Oscuro profundo y Modo Claro.
- **Totalmente Responsivo:** Diseñado desde pantallas móviles hasta monitores de escritorio ultrawide.
- **Transiciones y Notificaciones:** Sistema de alertas tipo *Sonner* con micro-animaciones fluidas.

---

## 🔒 Seguridad en Repositorio Público

Este repositorio es de acceso público. Por seguridad, **los archivos de entorno con credenciales activas están ignorados por `.gitignore`**:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- Archivos `.env` y credenciales locales

Se provee la plantilla [`src/environments/environment.example.ts`](src/environments/environment.example.ts) como referencia para configurar cualquier entorno nuevo.

---

## 🚀 Despliegue en GitHub Pages con GitHub Actions

El flujo automatizado se encuentra en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Para desplegar tu versión a GitHub Pages:

1. Ve a tu repositorio en GitHub: `https://github.com/Janosos/Inventario-ID`.
2. Dirígete a **Settings** > **Secrets and variables** > **Actions**.
3. Añade los siguientes **Repository Secrets**:
   - `SUPABASE_URL`: Tu URL de proyecto Supabase (ej. `https://xxxx.supabase.co`).
   - `SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase.
4. En **Settings** > **Pages**, asegúrate de que la fuente esté configurada como **GitHub Actions**.
5. Al hacer `git push origin main`, el flujo inyectará de forma segura las variables, compilará la aplicación y la publicará en GitHub Pages.

---

## 🛠️ Configuración de la Base de Datos (Supabase)

El script SQL completo y documentado se encuentra en [`supabase/schema.sql`](supabase/schema.sql).

### Pasos de Configuración:
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Dirígete a **SQL Editor** y ejecuta todo el script [`supabase/schema.sql`](supabase/schema.sql).
3. El script creará automáticamente:
   - Tabla `public.profiles` con roles `admin` y `normal`.
   - Función `delete_user_by_admin(UUID)` para eliminación segura de usuarios desde la app.
   - Tabla `public.inventory_items` con soporte de estados (incluyendo `para_piezas`).
   - Tabla `public.inventory_item_photos` y el bucket de almacenamiento público `inventory-photos` (límite de 10 MB por foto).
   - Políticas RLS (Row Level Security) que permiten lectura a todos los usuarios autenticados y escritura/baja exclusiva a Administradores.
   - Datos semilla iniciales de equipos.

---

## 💻 Ejecución en Desarrollo Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Janosos/Inventario-ID.git
   cd Inventario-ID
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar credenciales locales:**
   Copia el archivo de plantilla a tu entorno:
   ```bash
   cp src/environments/environment.example.ts src/environments/environment.ts
   cp src/environments/environment.example.ts src/environments/environment.prod.ts
   ```
   Abre `src/environments/environment.ts` y coloca tus claves de Supabase.

4. **Iniciar servidor de desarrollo:**
   ```bash
   npm start
   ```
   Abre [http://localhost:4200](http://localhost:4200) en tu navegador.

5. **Compilar para producción:**
   ```bash
   npm run build:gh
   ```

---

## 📄 Licencia

Este proyecto fue desarrollado por **Janosos (Ezequiel López)** para la gestión y control corporativo de activos de tecnologías de la información.
