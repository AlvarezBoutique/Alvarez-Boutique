-- ============================================================================
--  Alvarez Boutique — Cuentas de dueños y permisos de inventario
--  Ejecutar DESPUÉS de schema.sql (SQL Editor → New query → pegar todo → Run)
--
--  IMPORTANTE (una sola vez): en Supabase ve a
--    Authentication → Sign In / Providers → Email
--  y DESACTIVA "Confirm email". Como los dueños entran con nombre de usuario
--  (no reciben correos), esto les permite iniciar sesión de inmediato.
--
--  Modelo de cuentas: TODAS las cuentas son iguales, no hay rangos ni
--  categorías asignadas. Cualquier cuenta con sesión puede subir y editar
--  productos de CUALQUIER categoría, y crear otras cuentas.
-- ============================================================================

-- 1) Un perfil por cuenta.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  full_name   text,
  created_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 2) ¿Ya existe alguna cuenta? (para el asistente de "primera cuenta")
create or replace function public.has_accounts()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles);
$$;
grant execute on function public.has_accounts() to anon, authenticated;

-- 3) Al registrar una cuenta, se crea su perfil automáticamente desde los
--    metadatos que envía la app.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 4) Perfiles: toda cuenta con sesión ve la lista (pantalla Cuentas) y puede
--    editar únicamente el suyo. No hay rangos, así que nadie manda sobre nadie.
drop policy if exists "perfiles visibles con sesion" on public.profiles;
create policy "perfiles visibles con sesion" on public.profiles for select
  to authenticated using (true);

drop policy if exists "edita su propio perfil" on public.profiles;
create policy "edita su propio perfil" on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- 5) Productos: el catálogo sigue siendo de lectura pública (política de
--    schema.sql). Escribir requiere sesión, pero no limita la categoría.
drop policy if exists "products insert con sesion" on public.products;
create policy "products insert con sesion" on public.products for insert
  to authenticated with check (true);

drop policy if exists "products update con sesion" on public.products;
create policy "products update con sesion" on public.products for update
  to authenticated using (true) with check (true);

drop policy if exists "products delete con sesion" on public.products;
create policy "products delete con sesion" on public.products for delete
  to authenticated using (true);

-- 6) Fotos de producto: bucket público de lectura; sólo cuentas con sesión suben.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "imagenes lectura publica" on storage.objects;
create policy "imagenes lectura publica" on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "imagenes suben con sesion" on storage.objects;
create policy "imagenes suben con sesion" on storage.objects for insert
  to authenticated with check (bucket_id = 'product-images');

drop policy if exists "imagenes borran con sesion" on storage.objects;
create policy "imagenes borran con sesion" on storage.objects for delete
  to authenticated using (bucket_id = 'product-images');
