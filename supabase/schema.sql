-- ====================================================================================
-- INVENTARIO-ID - SUPABASE DATABASE & STORAGE SCHEMA
-- Sistema de Inventario de Equipo de Cómputo con Roles (Admin / Normal) y Fotos (<10MB)
-- ====================================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'normal')) DEFAULT 'normal',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentario descriptivo
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario con control de roles (admin y normal)';

-- 3. FUNCIÓN PARA VERIFICAR SI EL USUARIO ACTUAL ES ADMINISTRADOR (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$;

-- 4. TRIGGER PARA CREAR AUTOMÁTICAMENTE EL PERFIL CUANDO SE REGISTRE UN USUARIO EN AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    users_count INT;
    assigned_role TEXT;
BEGIN
    -- Contar cuántos perfiles existen
    SELECT COUNT(*) INTO users_count FROM public.profiles;

    -- Si es el primer usuario registrado en el sistema, asignarle rol de 'admin' automáticamente
    -- De lo contrario, revisa los metadatos o por defecto queda como 'normal'
    IF users_count = 0 THEN
        assigned_role := 'admin';
    ELSIF NEW.raw_user_meta_data->>'role' = 'admin' THEN
        -- Si viene explícitamente en metadata (opcional)
        assigned_role := 'admin';
    ELSE
        assigned_role := 'normal';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        assigned_role
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. TABLA DE EQUIPOS EN INVENTARIO
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                         -- Ej: 'Dell Latitude E5440' o 'Monitores Dell P2210t'
    category TEXT NOT NULL DEFAULT 'Laptop',     -- 'Laptop', 'Monitor', 'Desktop', 'Accesorio', 'Otro'
    brand TEXT NOT NULL DEFAULT 'Dell',         -- Ej: 'Dell'
    model TEXT,                                 -- Ej: 'Latitude E5440', 'P2210t', 'P2211ht'
    service_tag TEXT,                           -- ST (Ej: '1T0KP12', '7CJZN32')
    gorilla_tag TEXT,                           -- Etiqueta Gorilla (Ej: '1904', '2376')
    specifications TEXT,                        -- Ej: 'i5 4ta 8gb 120 HDD'
    observations TEXT,                          -- Ej: 'Cuenta con cargador'
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    status TEXT NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'en_uso', 'mantenimiento', 'para_piezas', 'baja')),
    location TEXT DEFAULT 'Oficina / Almacén',
    assigned_to TEXT,
    main_photo_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_inventory_service_tag ON public.inventory_items(service_tag);
CREATE INDEX IF NOT EXISTS idx_inventory_gorilla_tag ON public.inventory_items(gorilla_tag);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory_items(status);

-- 6. TABLA DE FOTOS DEL EQUIPO (Soporte de múltiples fotos por equipo)
CREATE TABLE IF NOT EXISTS public.inventory_item_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size <= 10485760), -- Restricción estricta de 10 MB (10 * 1024 * 1024 bytes)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_item_photos_item_id ON public.inventory_item_photos(item_id);

-- 7. CONFIGURACIÓN DEL STORAGE BUCKET: inventory-photos
-- Crea el bucket público 'inventory-photos' con límite de 10MB
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'inventory-photos',
    'inventory-photos',
    true,
    10485760, -- 10 MB máximo
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic'];

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_photos ENABLE ROW LEVEL SECURITY;

-- 8.1 Políticas RLS para PROFILES
-- Cualquiera autenticado puede leer los perfiles (para ver quién creó un ítem o ver su rol)
DROP POLICY IF EXISTS "Perfiles visibles por usuarios autenticados" ON public.profiles;
CREATE POLICY "Perfiles visibles por usuarios autenticados"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Solo el propio usuario puede actualizar su propio nombre o avatar, pero NO el rol
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND (
            role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- no puede auto-ascenderse
            OR public.is_admin()
        )
    );

-- Solo el admin puede gestionar roles de otros
DROP POLICY IF EXISTS "Admins pueden actualizar cualquier perfil" ON public.profiles;
CREATE POLICY "Admins pueden actualizar cualquier perfil"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8.2 Políticas RLS para INVENTORY_ITEMS
-- LECTURA: Todos los usuarios autenticados (admin y normal) pueden consultar el inventario
DROP POLICY IF EXISTS "Lectura de inventario para autenticados" ON public.inventory_items;
CREATE POLICY "Lectura de inventario para autenticados"
    ON public.inventory_items FOR SELECT
    TO authenticated
    USING (true);

-- CREACIÓN: Solo administradores pueden agregar equipos
DROP POLICY IF EXISTS "Solo admin puede insertar en inventario" ON public.inventory_items;
CREATE POLICY "Solo admin puede insertar en inventario"
    ON public.inventory_items FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- EDICIÓN: Solo administradores pueden modificar equipos
DROP POLICY IF EXISTS "Solo admin puede actualizar inventario" ON public.inventory_items;
CREATE POLICY "Solo admin puede actualizar inventario"
    ON public.inventory_items FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ELIMINACIÓN: Solo administradores pueden eliminar equipos
DROP POLICY IF EXISTS "Solo admin puede eliminar de inventario" ON public.inventory_items;
CREATE POLICY "Solo admin puede eliminar de inventario"
    ON public.inventory_items FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 8.3 Políticas RLS para INVENTORY_ITEM_PHOTOS
-- LECTURA: Usuarios autenticados pueden ver las fotos
DROP POLICY IF EXISTS "Lectura de fotos para autenticados" ON public.inventory_item_photos;
CREATE POLICY "Lectura de fotos para autenticados"
    ON public.inventory_item_photos FOR SELECT
    TO authenticated
    USING (true);

-- ESCRITURA / MODIFICACIÓN / ELIMINACIÓN: Solo administradores
DROP POLICY IF EXISTS "Solo admin puede agregar fotos" ON public.inventory_item_photos;
CREATE POLICY "Solo admin puede agregar fotos"
    ON public.inventory_item_photos FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede actualizar fotos" ON public.inventory_item_photos;
CREATE POLICY "Solo admin puede actualizar fotos"
    ON public.inventory_item_photos FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Solo admin puede eliminar fotos" ON public.inventory_item_photos;
CREATE POLICY "Solo admin puede eliminar fotos"
    ON public.inventory_item_photos FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 8.4 Políticas de Almacenamiento (storage.objects) para el bucket 'inventory-photos'
DROP POLICY IF EXISTS "Lectura publica o autenticada de fotos" ON storage.objects;
CREATE POLICY "Lectura publica o autenticada de fotos"
    ON storage.objects FOR SELECT
    TO public, authenticated
    USING (bucket_id = 'inventory-photos');

DROP POLICY IF EXISTS "Solo admin puede subir fotos al bucket" ON storage.objects;
CREATE POLICY "Solo admin puede subir fotos al bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'inventory-photos'
        AND public.is_admin()
    );

DROP POLICY IF EXISTS "Solo admin puede modificar o borrar fotos del bucket" ON storage.objects;
CREATE POLICY "Solo admin puede modificar o borrar fotos del bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'inventory-photos'
        AND public.is_admin()
    );

-- 9. DATOS SEMILLA (INSERCIÓN DE LOS EQUIPOS PROPORCIONADOS POR EL USUARIO)
INSERT INTO public.inventory_items (
    id,
    name,
    category,
    brand,
    model,
    service_tag,
    gorilla_tag,
    specifications,
    observations,
    quantity,
    status
) VALUES
(
    'e5440001-0000-4000-8000-000000000001',
    'Dell Latitude E5440',
    'Laptop',
    'Dell',
    'Latitude E5440',
    '1T0KP12',
    '1904',
    'i5 4ta 8gb 120 HDD',
    'Cuenta con cargador',
    1,
    'disponible'
),
(
    'e5440002-0000-4000-8000-000000000002',
    'Dell Latitude E5440',
    'Laptop',
    'Dell',
    'Latitude E5440',
    '7CJZN32',
    '2376',
    'i5 4ta 8gb 128 HDD',
    'Cuenta con cargador. Requiere/tiene foto.',
    1,
    'disponible'
),
(
    'd2210003-0000-4000-8000-000000000003',
    'Monitores Dell P2210t',
    'Monitor',
    'Dell',
    'P2210t',
    NULL,
    NULL,
    'Monitor Dell 22" Profesional DVI/VGA/DisplayPort',
    '11 en total contando este',
    11,
    'disponible'
),
(
    'd2211004-0000-4000-8000-000000000004',
    'Monitores Dell P2211ht',
    'Monitor',
    'Dell',
    'P2211ht',
    NULL,
    NULL,
    'Monitor Dell 21.5" Full HD LED DVI/VGA',
    '2 en total',
    2,
    'disponible'
)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================================
-- NOTA IMPORTANTE PARA GESTIONAR ROLES MANUALMENTE:
-- Para convertir a un usuario específico en Administrador de inmediato, ejecuta:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'tu_correo@ejemplo.com';
--
-- PARA ACTUALIZAR LA RESTRICCIÓN DE ESTADOS ('para_piezas') EN SUPABASE SI YA CREASTE LA TABLA:
-- ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_status_check;
-- ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_status_check CHECK (status IN ('disponible', 'en_uso', 'mantenimiento', 'para_piezas', 'baja'));
-- ====================================================================================
